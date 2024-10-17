import React from 'react';
import { Input } from '@/components/ui/input';
import Logo from '@/components/logo';

type HeaderProps = {
  userAPIKey: string;
  setUserAPIKey: (key: string) => void;
};

const Header: React.FC<HeaderProps> = ({ userAPIKey, setUserAPIKey }) => (
  <header style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem' }}>
    <div style={{ position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)' }}>
      <a href='https://www.dub.sh/together-ai' target='_blank' rel='noopener noreferrer'>
        <Logo />
      </a>
    </div>
    <div>
      <label style={{ fontSize: '0.75rem', color: '#e5e7eb' }}>
        [Optional] Add your{' '}
        <a
          href='https://api.together.xyz/settings/api-keys'
          target='_blank'
          rel='noopener noreferrer'
          style={{
            textDecoration: 'underline',
            textUnderlineOffset: '0.25rem',
            transition: 'color 0.2s',
            color: 'inherit',
          }}
        >
          Together API Key
        </a>
      </label>
      <Input
        placeholder='API Key'
        type='password'
        value={userAPIKey}
        style={{
          marginTop: '0.25rem',
          backgroundColor: '#9ca3af',
          color: '#e5e7eb',
        }}
        onChange={(e) => setUserAPIKey(e.target.value)}
      />
    </div>
  </header>
);

export default Header;
