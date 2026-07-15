import React, { useState } from 'react';
import { Shield, UserPlus, Lock, Trash2, Edit2, AlertCircle, Check, Key, UserCheck } from 'lucide-react';
import { UserAccount } from '../types';

interface UserManagementProps {
  users: UserAccount[];
  currentUserUsername: string;
  onAddUser: (user: Omit<UserAccount, 'id' | 'created_at'>) => boolean;
  onUpdateUser: (id: string, updated: Partial<UserAccount>) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManagement({
  users,
  currentUserUsername,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}: UserManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Gestor de Contenido');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');

  const handleOpenAddModal = () => {
    setUsername('');
    setName('');
    setPassword('');
    setRole('Gestor de Contenido');
    setError(null);
    setSuccessMsg(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPassword(user.password || '');
    setEditRole(user.role);
    setError(null);
    setSuccessMsg(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('El nombre de usuario es obligatorio.');
      return;
    }
    if (cleanUsername.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (!name.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }

    const success = onAddUser({
      username: cleanUsername,
      name: name.trim(),
      password: password,
      role: role
    });

    if (success) {
      setSuccessMsg(`Usuario "${cleanUsername}" registrado con éxito.`);
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg(null);
      }, 1000);
    } else {
      setError('Este nombre de usuario ya está registrado en el sistema.');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);

    if (!editName.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }
    if (editPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    onUpdateUser(editingUser.id, {
      name: editName.trim(),
      password: editPassword,
      role: editRole
    });

    setSuccessMsg(`Usuario "${editingUser.username}" actualizado correctamente.`);
    setTimeout(() => {
      setEditingUser(null);
      setSuccessMsg(null);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header section */}
      <div className="bg-white border border-silver-haze p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-tomato-curry" />
            <h2 className="text-lg font-bold text-cosmic-black uppercase tracking-tight">Administración de Usuarios y Accesos</h2>
          </div>
          <p className="text-xs text-slate-500">
            Controla qué personas tienen acceso al CRM de Flamo, sus contraseñas corporativas y roles de gestión.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-tomato-curry hover:bg-tomato-curry/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Agregar Nuevo Usuario</span>
        </button>
      </div>

      {/* Main Table card */}
      <div className="bg-white border border-silver-haze rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuentas Registradas en el Sistema</span>
          <span className="text-[10px] bg-white border border-slate-200 text-slate-400 font-mono px-2 py-0.5 rounded-full font-bold">
            {users.length} Cuentas activas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50/30 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Rol / Puesto</th>
                <th className="px-6 py-4">Contraseña Corporativa</th>
                <th className="px-6 py-4">Fecha Alta</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {users.map((user) => {
                const isActiveUser = user.username.toLowerCase() === currentUserUsername.toLowerCase();
                const isAdminUser = user.username.toLowerCase() === 'admin';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono font-semibold text-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{user.username}</span>
                        {isActiveUser && (
                          <span className="bg-tomato-curry/10 text-tomato-curry text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold">
                            Tu Sesión
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{user.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-slate-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-400">
                        <Key className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                        <span>{user.password || '••••••••'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono font-semibold">{user.created_at}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 text-slate-400 hover:text-celestial-canvas hover:bg-celestial-canvas/10 rounded-lg transition-all cursor-pointer"
                          title="Editar Datos & Contraseña"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          disabled={isAdminUser || isActiveUser}
                          onClick={() => {
                            if (confirm(`¿Estás completamente seguro de que deseas revocar el acceso y eliminar al usuario "${user.username}"?`)) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-all ${
                            isAdminUser || isActiveUser
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-300 hover:text-tomato-curry hover:bg-tomato-curry/10 cursor-pointer'
                          }`}
                          title={isAdminUser || isActiveUser ? "No puedes eliminar este usuario administrador activo" : "Eliminar Usuario"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECURITY EXPLANATION NOTICE */}
      <div className="bg-slate-50 border border-silver-haze rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-500">
          <UserCheck className="w-4 h-4 text-tomato-curry" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Funcionamiento de la Base de Datos Local</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Las credenciales de acceso se guardan directamente en el motor persistente local de tu navegador (<code className="font-mono bg-white border border-slate-200 px-1 rounded text-[10px]">localStorage</code>). Al descargar y montar tu sitio web en <strong>Hostinger</strong>, podrás configurar estas mismas cuentas dentro de tu base de datos SQL (PostgreSQL o MySQL) creando una tabla de usuarios que valide las credenciales en tu backend.
        </p>
      </div>

      {/* MODAL: ADD USER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-cosmic-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-4 bg-slate-50 border-b border-silver-haze flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-cosmic-black tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-tomato-curry" />
                <span>Agregar Nuevo Usuario</span>
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-cosmic-black text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-tomato-curry/10 border border-tomato-curry/20 text-tomato-curry rounded-xl p-3 flex items-start gap-2.5 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-3 flex items-start gap-2.5 text-xs font-semibold">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{successMsg}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Usuario de acceso (Minúsculas, sin espacios) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. carlosm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Contraseña Corporativa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. carlos2026"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Rol / Cargo Corporativo *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Director de Booking">Director de Booking</option>
                  <option value="Director de Finanzas">Director de Finanzas</option>
                  <option value="Gestor de Contenido">Gestor de Contenido</option>
                  <option value="Abogado Legal CRM">Abogado Legal CRM</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white border border-silver-haze text-slate-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-tomato-curry hover:bg-tomato-curry/90 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm cursor-pointer"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 bg-cosmic-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-4 bg-slate-50 border-b border-silver-haze flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-cosmic-black tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-tomato-curry" />
                <span>Editar Usuario: {editingUser.username}</span>
              </h4>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-cosmic-black text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              {error && (
                <div className="bg-tomato-curry/10 border border-tomato-curry/20 text-tomato-curry rounded-xl p-3 flex items-start gap-2.5 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-3 flex items-start gap-2.5 text-xs font-semibold">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{successMsg}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Usuario de acceso</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.username}
                  className="w-full bg-slate-100 border border-silver-haze rounded-xl p-2.5 font-mono text-slate-500 text-xs cursor-not-allowed"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">El nombre de usuario único no se puede modificar.</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Contraseña Corporativa *</label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Rol / Cargo Corporativo *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Director de Booking">Director de Booking</option>
                  <option value="Director de Finanzas">Director de Finanzas</option>
                  <option value="Gestor de Contenido">Gestor de Contenido</option>
                  <option value="Abogado Legal CRM">Abogado Legal CRM</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-white border border-silver-haze text-slate-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-tomato-curry hover:bg-tomato-curry/90 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm cursor-pointer"
                >
                  Actualizar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
