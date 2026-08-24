import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return toast.error('This password-reset link is invalid.');
    if (newPassword.length < 8) return toast.error('Your new password must be at least 8 characters long.');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to reset your password.');
      toast.success(data.message);
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-['Poppins']">
      <section className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-center text-3xl font-semibold text-[#11265A]">Set a new password</h1>
        <p className="mt-3 text-center text-sm text-gray-600">Choose a new password with at least 8 characters.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New password</label>
            <input id="new-password" type="password" required minLength="8" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm new password</label>
            <input id="confirm-password" type="password" required minLength="8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={isSubmitting || !token} className="w-full rounded-md bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600"><Link to="/login" className="font-medium text-blue-600 hover:underline">Back to login</Link></p>
      </section>
    </main>
  );
};

export default ResetPassword;
