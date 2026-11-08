'use client';

import React, { useActionState } from 'react';
import { signIn } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, null);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">TEST CRM</div>
          <div className="login-subtitle">Sign in to your employee account</div>
        </div>

        {state?.error && (
          <div className="login-error">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input-text"
              required
              placeholder="employee@firm.com"
              disabled={isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="input-text"
              required
              placeholder="••••••••"
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={isPending}
          >
            {isPending ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
