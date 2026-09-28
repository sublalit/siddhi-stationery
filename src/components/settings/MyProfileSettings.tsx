'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, KeyRound, Save, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { updateUserProfile } from '@/lib/actions/auth';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function MyProfileSettings() {
  const { name, email, avatarUrl, role, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(name);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(name);
    if (!imageFile) setPreviewUrl(avatarUrl || '');
  }, [name, avatarUrl, imageFile]);

  useEffect(() => {
    if (!imageFile) return;
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handlePhotoChange = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image must be 5MB or smaller.');
      return;
    }
    setProfileError(null);
    setImageFile(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setProfileError('You must be signed in to save your profile.');
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileMsg(null);

      let nextAvatar = avatarUrl;
      if (imageFile) {
        const payload = new FormData();
        payload.append('file', imageFile);
        const res = await fetch('/api/uploads', { method: 'POST', body: payload });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.url) {
          throw new Error(json.error || 'Failed to upload profile photo');
        }
        nextAvatar = json.url;
      }

      const result = await updateUserProfile(email, {
        name: fullName,
        avatarUrl: nextAvatar,
      });

      if (!result.success || !result.user) {
        throw new Error(result.error || 'Failed to save profile');
      }

      updateProfile({
        name: result.user.name,
        avatarUrl: result.user.avatarUrl,
      });
      setImageFile(null);
      setPreviewUrl(result.user.avatarUrl || '');
      setProfileMsg('Profile saved.');
    } catch (err: any) {
      setProfileError(err?.message || 'Could not save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No active Supabase session. Sign in with email and password to change it.');
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);

      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password updated.');
    } catch (err: any) {
      setPasswordError(err?.message || 'Could not update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 bg-cyan-50 text-[#00aeef] rounded-xl">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500 font-medium">Name and photo shown in the header</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative shrink-0"
              title="Change profile photo"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="h-20 w-20 rounded-full object-cover border border-slate-200 bg-slate-100"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                  {(fullName || name || email || '?')
                    .trim()
                    .split(/[\s._-]+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase() || '?'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#00aeef] text-white flex items-center justify-center shadow-sm">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </button>
            <div>
              <p className="font-semibold text-slate-700">Profile Photo</p>
              <p className="text-slate-500 mt-0.5">JPEG, PNG, GIF, or WebP · max 5MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0])}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role</label>
            <input
              type="text"
              disabled
              value={role}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed uppercase"
            />
          </div>

          {profileError && <p className="text-red-500 font-semibold">{profileError}</p>}
          {profileMsg && (
            <p className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {profileMsg}
            </p>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2 bg-gradient-to-r from-[#00aeef] to-[#0284c7] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{profileSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 bg-cyan-50 text-[#00aeef] rounded-xl">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Security / Change Password</h2>
            <p className="text-xs text-slate-500 font-medium">Updates your Supabase auth password</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#00aeef]"
            />
          </div>

          {passwordError && <p className="text-red-500 font-semibold">{passwordError}</p>}
          {passwordMsg && (
            <p className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {passwordMsg}
            </p>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
