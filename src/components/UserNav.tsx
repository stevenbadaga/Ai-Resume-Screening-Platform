'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

interface UserNavProps {
  userName?: string | null;
  userEmail?: string | null;
}

export default function UserNav({ userName, userEmail }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const name = userName || session?.user?.name || 'User';
  const email = userEmail || session?.user?.email || '';
  const initial = (name[0] || email[0] || 'U').toUpperCase();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.35rem 0.75rem 0.35rem 0.35rem',
          backgroundColor: isOpen ? 'var(--surface-hover)' : 'transparent',
          border: '1px solid ' + (isOpen ? 'var(--border)' : 'transparent'),
          borderRadius: '2rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none'
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '0.875rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {initial}
        </div>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{name}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{email}</span>
        </div>
        <svg 
          style={{ 
            width: '14px', 
            height: '14px', 
            marginLeft: '0.25rem', 
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Glassmorphism Dropdown */}
      {isOpen && (
        <div 
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '260px',
            padding: '0.5rem',
            zIndex: 100,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            animation: 'fadeIn 0.12s ease-out'
          }}
        >
          {/* User Info Header */}
          <div style={{ padding: '0.75rem 0.75rem 0.5rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{name}</p>
            <p style={{ margin: '0.15rem 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
            <span style={{ 
              display: 'inline-block',
              fontSize: '0.7rem', 
              padding: '0.15rem 0.5rem', 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              color: 'var(--primary)', 
              borderRadius: '1rem',
              fontWeight: 600
            }}>
              Active Workspace
            </span>
          </div>

          {/* Quick Menu Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', padding: '0.25rem 0' }}>
            <Link
              href="/dashboard/team"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                color: 'var(--text)',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                transition: 'background 0.1s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Manage Team & Roles</span>
            </Link>

            <Link
              href="/audit"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                color: 'var(--text)',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                transition: 'background 0.1s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Security & Audit Logs</span>
            </Link>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.25rem 0' }} />

          {/* Sign Out Action */}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.85rem',
              color: 'var(--accent)',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 500,
              transition: 'background 0.1s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}