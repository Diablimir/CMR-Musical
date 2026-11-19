#!/usr/bin/env python3
"""Genera docs/diagrama-er.(svg|png) a partir de docs/database/schema_tables.json (esquema real). Requiere Graphviz (dot)."""
import json, re, subprocess, pathlib, html

root = pathlib.Path(__file__).resolve().parent.parent
tables = json.loads((root / 'docs/database/schema_tables.json').read_text(encoding='utf-8'))

COLORS = {  # color de cabecera por grupo
    'artistas': '#E84A2E', 'artista_generos': '#E84A2E', 'artista_contactos': '#E84A2E', 'tours': '#E84A2E', 'tour_artistas': '#E84A2E', 'proyectos_grabacion': '#E84A2E',
    'venues': '#0A2538', 'venue_contactos': '#0A2538', 'proveedores': '#0A2538', 'venue_proveedores': '#0A2538', 'proveedor_contactos': '#0A2538',
    'contactos': '#2F6F5E', 'contacto_correos': '#2F6F5E', 'contacto_telefonos': '#2F6F5E',
    'eventos': '#B7791F', 'evento_artistas': '#B7791F', 'contratos': '#B7791F',
    'artista_redes': '#E84A2E', 'artista_idiomas': '#E84A2E', 'artista_integrantes': '#E84A2E', 'artista_pipeline': '#E84A2E', 'artista_hitos': '#E84A2E',
    'proyecto_canciones': '#E84A2E', 'proyecto_costos': '#E84A2E', 'proyecto_pagos': '#E84A2E', 'proyecto_etapas': '#E84A2E', 'proyecto_instrumentos': '#E84A2E',
    'venue_horarios': '#0A2538', 'artista_metricas_redes': '#E84A2E', 'artista_acciones': '#E84A2E', 'artista_conexiones': '#E84A2E', 'cambios_pendientes': '#7C8794', 'artista_alcance': '#E84A2E', 'artista_demografia': '#E84A2E', 'artista_publicaciones': '#E84A2E', 'venue_notas': '#0A2538', 'venue_bandas_locales': '#0A2538',
    'evento_setlist': '#B7791F', 'evento_bandas_invitadas': '#B7791F',
    'contrato_artistas': '#B7791F', 'contrato_venues': '#B7791F', 'contrato_proveedores': '#B7791F', 'contrato_eventos': '#B7791F', 'contrato_tours': '#B7791F',
    'cat_etapas_desarrollo': '#7C8794', 'cat_generos': '#7C8794', 'cat_roles_contacto': '#7C8794', 'cat_monedas': '#7C8794',
}
edges = []
rows = []
HIDE = {'extra', 'created_at', 'updated_at', 'deleted_at'}
for t in tables:
    cells = []
    shown = 0; hidden = 0
    for c in t['columns']:
        if 'OBSOLETO' in c.get('notes', ''):
            continue
        tag = c.get('key')
        mm0 = re.search(r'→ (\w+)\(', c.get('notes', ''))
        if not tag and not mm0:
            if c['name'] in HIDE or shown >= 4:
                hidden += 1
                continue
            shown += 1
        isfk = bool(re.search(r'→ (\w+)\(', c.get('notes', '')))
        key = ('<B>PK</B>' if tag == 'PK' else '') + (' ' if tag == 'PK' and isfk else '') + ('<B><FONT COLOR="#C05621">FK</FONT></B>' if isfk else '')
        if c['name'] == 'extra':
            name = f'<I>{html.escape(c["name"])}</I>'
        else:
            name = ('<B>' if tag == 'PK' else '') + html.escape(c['name']) + ('</B>' if tag == 'PK' else '')
        typ = html.escape(c['type'])
        cells.append(f'<TR><TD ALIGN="LEFT" PORT="{c["name"]}" WIDTH="26">{key}</TD><TD ALIGN="LEFT">{name}</TD><TD ALIGN="LEFT"><FONT COLOR="#6B7280" POINT-SIZE="10">{typ}</FONT></TD></TR>')
        mm = re.search(r'→ (\w+)\((\w+)\)(?:, al borrar: ([A-Z ]+))?', c.get('notes', ''))
        if mm:
            edges.append((t['name'], c['name'], mm.group(1), mm.group(2), mm.group(3) or 'RESTRICT', 'Obligatorio' in c.get('notes', '')))
    if hidden:
        cells.append(f'<TR><TD></TD><TD ALIGN="LEFT" COLSPAN="2"><FONT COLOR="#94A3B8" POINT-SIZE="9"><I>+ {hidden} columnas más</I></FONT></TD></TR>')
    color = COLORS.get(t['name'], '#374151')
    rows.append(f'''  {t["name"]} [label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4" COLOR="#CBD5E1" BGCOLOR="white">
    <TR><TD COLSPAN="3" BGCOLOR="{color}"><FONT COLOR="white"><B>{t["name"]}</B></FONT></TD></TR>
    {"".join(cells)}</TABLE>>];''')

lines = ['digraph ER {', '  graph [rankdir=LR, splines=true, nodesep=0.7, ranksep=1.0, pad=0.5, fontname="Helvetica", bgcolor="white", label=<<B>FLAMO CRM · Diagrama entidad-relación</B><BR/><FONT POINT-SIZE="11" COLOR="#64748B">Esquema v10 · solo columnas clave · punteada = al borrar el padre queda en NULL · pata de gallo = muchos</FONT>>, labelloc=t, fontsize=18];',
         '  node [shape=plain, fontname="Helvetica", fontsize=11];', '  edge [fontname="Helvetica", fontsize=9, fontcolor="#475569", color="#64748B", arrowsize=0.9];'] + rows
for (src_t, col, dst, dcol, rule, req) in edges:
    style = 'dashed' if rule == 'SET NULL' else 'solid'
    note = {'CASCADE': ' · CASCADE', 'SET NULL': ' · SET NULL'}.get(rule, '')
    lines.append(f'  {src_t} -> {dst} [dir=both, arrowtail=crow, arrowhead={"tee" if req else "teeodot"}, style={style}, label="  {col}{note}  "];')
lines.append('}')
dot = '\n'.join(lines)
out = root / 'docs'; out.mkdir(exist_ok=True)
(out / 'diagrama-er.dot').write_text(dot, encoding='utf-8')
for fmt in ('svg', 'png'):
    extra = ['-Gdpi=150'] if fmt == 'png' else []
    subprocess.run(['dot', f'-T{fmt}', *extra, str(out / 'diagrama-er.dot'), '-o', str(out / f'diagrama-er.{fmt}')], check=True)
print('OK:', len(tables), 'tablas,', len(edges), 'relaciones')
