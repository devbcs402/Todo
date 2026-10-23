import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login, register } from '../api/todoService';

const AuthPage = ({ mode, onAuthenticated }) => {
  const isRegister = mode === 'register';
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (isRegister && !values.name.trim()) nextErrors.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (values.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (isRegister && values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError('');
    try {
      const result = isRegister
        ? await register({ name: values.name.trim(), email: values.email.trim(), password: values.password })
        : await login({ email: values.email.trim(), password: values.password });
      onAuthenticated(result.user);
    } catch (error) {
      setFormError(isRegister ? error.message : 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (name, label, type, autoComplete, options = {}) => (
    <div className="auth-field" key={name}>
      <label htmlFor={`auth-${name}`}>{label}</label>
      <input
        id={`auth-${name}`}
        name={name}
        type={type}
        value={values[name]}
        onChange={updateField}
        autoComplete={autoComplete}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `auth-${name}-error` : undefined}
        maxLength={name === 'name' ? 80 : name === 'email' ? 254 : 128}
        required
        {...options}
      />
      {errors[name] && <span className="auth-field-error" id={`auth-${name}-error`}>{errors[name]}</span>}
    </div>
  );

  return (
    <main className="auth-page">
      <section className="auth-panel glass-panel" aria-labelledby="auth-title">
        <div className="auth-mark" aria-hidden="true">✓</div>
        <p className="auth-eyebrow">TODO MASTER</p>
        <h1 id="auth-title">{isRegister ? 'Make room for focus.' : 'Welcome back.'}</h1>
        <p className="auth-subtitle">
          {isRegister ? 'Create your account and keep your work in one place.' : 'Sign in to pick up where you left off.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isRegister && field('name', 'Name', 'text', 'name')}
          {field('email', 'Email', 'email', 'email')}
          <div className="auth-password-group">
            {field('password', 'Password', showPassword ? 'text' : 'password', isRegister ? 'new-password' : 'current-password')}
            {isRegister && field('confirmPassword', 'Confirm password', showPassword ? 'text' : 'password', 'new-password')}
            {!isRegister && (
              <label className="auth-show-password">
                <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
                <span>Show password</span>
              </label>
            )}
          </div>
          {formError && <p className="auth-form-error" role="alert">{formError}</p>}
          <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account? ' : 'New here? '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
        </p>
      </section>
    </main>
  );
};

export default AuthPage;