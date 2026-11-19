<?php
declare(strict_types=1);

// Cambios pendientes de aprobación.
// · Super Admin: sus cambios se aplican de inmediato y es el único que elimina y aprueba.
// · Los demás roles: pueden crear y editar, pero cada cambio queda como PROPUESTA (tabla cambios_pendientes) hasta que el Super Admin la aprueba
//   (se aplica con las mismas validaciones y el mismo control de versiones) o la rechaza con un motivo. No pueden eliminar.

const MAX_PENDING_PER_USER = 500;
const MAX_PROPOSAL_BYTES = 1048576;

function can_approve(array $u): bool { return in_array($u['role'] ?? '', APPROVER_ROLES, true); }
function col_table(string $key): string { return $key === 'contacts' ? 'contactos' : entity_defs()[$key]['table']; }
function record_label(array $o): string { return mb_substr((string)($o['name'] ?? $o['artisticName'] ?? $o['title'] ?? $o['id'] ?? ''), 0, 120); }
function iso_ms(?string $v): ?string { return $v === null ? null : substr(str_replace(' ', 'T', $v), 0, 23) . 'Z'; }

/**
 * Valida y guarda como propuestas los cambios de alguien que NO puede aprobar. No se aplica nada.
 * @return list<array{collection:string,id:string,action:string}>
 */
function propose_changes(PDO $pdo, array $user, array $changes): array {
    foreach ($changes as $key => $c) {
        if (!in_array($key, UPSERT_ORDER, true)) throw new SyncError("Colección desconocida «{$key}».", 400, 'bad_request');
        if (!empty($c['deletes'])) throw new SyncError('Solo el Super Admin puede eliminar registros.', 403, 'forbidden_delete');
    }
    $mine = $pdo->prepare("SELECT COUNT(*) FROM cambios_pendientes WHERE propuesto_por = ? AND estado = 'pendiente'");
    $mine->execute([$user['id']]);
    $pendingNow = (int)$mine->fetchColumn();
    $now = gmdate('Y-m-d H:i:s') . '.000';
    $out = [];
    foreach (UPSERT_ORDER as $key) {
        $ups = $changes[$key]['upserts'] ?? [];
        if (!is_array($ups)) continue;
        foreach ($ups as $obj) {
            if (!is_array($obj) || !isset($obj['id']) || !is_string($obj['id']) || $obj['id'] === '' || strlen($obj['id']) > 40) throw new SyncError("Registro sin identificador válido en «{$key}».");
            $json = json_encode($obj, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($json === false || strlen($json) > MAX_PROPOSAL_BYTES) throw new SyncError('El registro es demasiado grande.', 413, 'too_large');
            // Validación en seco con las MISMAS reglas que al aplicar (dominios, versiones…). Si depende de otro registro que también está pendiente
            // (error de llave foránea), esa comprobación se hace al aprobar, en orden.
            try { apply_changes($pdo, [$key => ['upserts' => [$obj]]], false, true); }
            catch (PDOException $e) { if ((int)($e->errorInfo[1] ?? 0) !== 1452) throw $e; }
            finally { catalog_cache_clear(); }
            $cur = $pdo->prepare('SELECT version FROM ' . col_table($key) . ' WHERE id = ?'); $cur->execute([$obj['id']]);
            $v = $cur->fetchColumn();
            $pdo->prepare("DELETE FROM cambios_pendientes WHERE coleccion = ? AND registro_id = ? AND propuesto_por = ? AND estado = 'pendiente'")->execute([$key, $obj['id'], $user['id']]);   // la última propuesta reemplaza a la anterior
            if ($pendingNow >= MAX_PENDING_PER_USER) throw new SyncError('Tienes demasiados cambios pendientes de aprobación. Espera a que el Super Admin los revise.', 429, 'too_many_pending');
            $pdo->prepare('INSERT INTO cambios_pendientes (id, coleccion, registro_id, accion, datos, version_base, propuesto_por, propuesto_nombre, creado_en) VALUES (?,?,?,?,?,?,?,?,?)')
                ->execute(['chg-' . bin2hex(random_bytes(8)), $key, $obj['id'], $v === false ? 'crear' : 'editar', $json, $v === false ? null : (int)$v, $user['id'], mb_substr((string)$user['name'], 0, 100), $now]);
            $pendingNow++;
            $out[] = ['collection' => $key, 'id' => $obj['id'], 'action' => $v === false ? 'crear' : 'editar'];
        }
    }
    return $out;
}

function pending_count(PDO $pdo): int { return (int)$pdo->query("SELECT COUNT(*) FROM cambios_pendientes WHERE estado = 'pendiente'")->fetchColumn(); }

/** Para el Super Admin: todas las propuestas pendientes con el registro ACTUAL, para mostrar el antes y el después. */
function list_pending(PDO $pdo): array {
    $rows = $pdo->query("SELECT * FROM cambios_pendientes WHERE estado = 'pendiente' ORDER BY creado_en, id")->fetchAll();
    if (!$rows) return [];
    $cur = []; foreach (load_all($pdo) as $k => $arr) if (is_array($arr)) foreach ($arr as $r) if (isset($r['id'])) $cur[$k][$r['id']] = $r;
    return array_map(fn($r) => [
        'id' => $r['id'], 'collection' => $r['coleccion'], 'recordId' => $r['registro_id'], 'action' => $r['accion'],
        'data' => json_decode((string)$r['datos'], true), 'current' => $cur[$r['coleccion']][$r['registro_id']] ?? null,
        'baseVersion' => $r['version_base'] === null ? null : (int)$r['version_base'], 'byId' => $r['propuesto_por'], 'byName' => $r['propuesto_nombre'], 'at' => iso_ms($r['creado_en']),
    ], $rows);
}

/** Para cualquier usuario: SUS propuestas (las pendientes con su contenido; las resueltas de los últimos 30 días con el resultado). */
function my_changes(PDO $pdo, string $uid): array {
    $st = $pdo->prepare("SELECT * FROM cambios_pendientes WHERE propuesto_por = ? AND (estado = 'pendiente' OR resuelto_en >= ?) ORDER BY creado_en DESC, id LIMIT 300");
    $st->execute([$uid, gmdate('Y-m-d H:i:s', time() - 30 * 86400)]);
    return array_map(function ($r) {
        $d = json_decode((string)$r['datos'], true) ?: [];
        $o = ['id' => $r['id'], 'collection' => $r['coleccion'], 'recordId' => $r['registro_id'], 'action' => $r['accion'], 'status' => $r['estado'], 'label' => record_label($d),
            'at' => iso_ms($r['creado_en']), 'resolvedAt' => iso_ms($r['resuelto_en']), 'resolvedBy' => $r['resuelto_por'], 'reason' => $r['motivo']];
        if ($r['estado'] === 'pendiente') $o['data'] = $d;
        return $o;
    }, $st->fetchAll());
}

function db_error_text(PDOException $e): string {
    return match ((int)($e->errorInfo[1] ?? 0)) {
        1452 => 'Depende de otro registro que aún no existe (por ejemplo, un artista nuevo pendiente): apruébalo primero.',
        1062 => 'Ya existe un registro igual (valor duplicado).',
        4025, 3819 => 'Algún valor está fuera del rango o dominio permitido.',
        1406 => 'Un texto es demasiado largo.',
        default => 'Error de base de datos al aplicar el cambio.',
    };
}

/**
 * Aprueba (aplica) propuestas en el orden correcto (primero artistas/venues…, luego eventos/contratos). Cada una es independiente:
 * si una falla, las demás siguen. Con $force, una edición sobre un registro que cambió después se aplica de todos modos.
 * @return list<array{id:string,ok:bool,code?:string,error?:string}>
 */
function approve_changes(PDO $pdo, array $ids, array $admin, bool $force = false): array {
    $ids = array_values(array_unique(array_filter($ids, fn($x) => is_string($x) && $x !== '')));
    if (!$ids) return [];
    $order = "FIELD(coleccion, '" . implode("','", UPSERT_ORDER) . "')";
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare("SELECT * FROM cambios_pendientes WHERE id IN ($in) AND estado = 'pendiente' ORDER BY $order, creado_en, id");
    $st->execute($ids);
    $res = []; $found = [];
    foreach ($st->fetchAll() as $r) {
        $found[$r['id']] = true; $key = $r['coleccion'];
        $obj = json_decode((string)$r['datos'], true);
        try {
            $q = $pdo->prepare('SELECT version FROM ' . col_table($key) . ' WHERE id = ?'); $q->execute([$r['registro_id']]); $v = $q->fetchColumn();
            if ($r['accion'] === 'editar' && $v === false) { $res[] = ['id' => $r['id'], 'ok' => false, 'code' => 'gone', 'error' => 'El registro fue eliminado después de la propuesta; no se puede aplicar la edición.']; continue; }
            if ($force && $v !== false) $obj['version'] = (int)$v;
            apply_changes($pdo, [$key => ['upserts' => [$obj]]]);
            $pdo->prepare("UPDATE cambios_pendientes SET estado = 'aprobado', resuelto_por = ?, resuelto_en = ?, motivo = NULL WHERE id = ? AND estado = 'pendiente'")
                ->execute([mb_substr((string)$admin['name'], 0, 100), gmdate('Y-m-d H:i:s') . '.000', $r['id']]);
            $res[] = ['id' => $r['id'], 'ok' => true];
        } catch (ConflictError $e) {
            $res[] = ['id' => $r['id'], 'ok' => false, 'code' => 'conflict', 'error' => 'El registro cambió después de la propuesta. Revisa la diferencia o aprueba de todos modos.'];
        } catch (SyncError $e) {
            $res[] = ['id' => $r['id'], 'ok' => false, 'code' => 'invalid', 'error' => $e->getMessage()];
        } catch (PDOException $e) {
            $res[] = ['id' => $r['id'], 'ok' => false, 'code' => 'db', 'error' => db_error_text($e)];
        } finally { catalog_cache_clear(); }
    }
    foreach ($ids as $id) if (!isset($found[$id])) $res[] = ['id' => $id, 'ok' => false, 'code' => 'not_pending', 'error' => 'Esa propuesta ya fue resuelta o no existe.'];
    return $res;
}

/** Rechaza propuestas pendientes con un motivo (visible para quien las propuso). Devuelve cuántas se rechazaron. */
function reject_changes(PDO $pdo, array $ids, array $admin, string $reason = ''): int {
    $ids = array_values(array_unique(array_filter($ids, fn($x) => is_string($x) && $x !== '')));
    if (!$ids) return 0;
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare("UPDATE cambios_pendientes SET estado = 'rechazado', resuelto_por = ?, resuelto_en = ?, motivo = ? WHERE id IN ($in) AND estado = 'pendiente'");
    $st->execute(array_merge([mb_substr((string)$admin['name'], 0, 100), gmdate('Y-m-d H:i:s') . '.000', trim($reason) === '' ? null : mb_substr(trim($reason), 0, 255)], $ids));
    $n = $st->rowCount();
    $pdo->prepare("DELETE FROM cambios_pendientes WHERE estado <> 'pendiente' AND resuelto_en < ?")->execute([gmdate('Y-m-d H:i:s', time() - 180 * 86400)]);   // la bitácora se conserva 180 días
    return $n;
}

/** Quien propuso un cambio puede retirarlo mientras siga pendiente (solo los suyos). Devuelve cuántos retiró. */
function withdraw_changes(PDO $pdo, array $ids, string $uid): int {
    $ids = array_values(array_unique(array_filter($ids, fn($x) => is_string($x) && $x !== '')));
    if (!$ids) return 0;
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare("DELETE FROM cambios_pendientes WHERE id IN ($in) AND propuesto_por = ? AND estado = 'pendiente'");
    $st->execute(array_merge($ids, [$uid]));
    return $st->rowCount();
}
