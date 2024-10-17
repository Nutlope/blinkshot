import React from 'react';
import { Button } from '@/components/ui/button';
import GithubIcon from '@/components/icons/github-icon';
import XIcon from '@/components/icons/x-icon';
import Spinner from '@/components/spinner';
import { Download } from 'lucide-react';

type FooterProps = {
  downloadBook: () => void;
  isGeneratingDocx: boolean;
};

const Footer: React.FC<FooterProps> = ({ downloadBook, isGeneratingDocx }) => (
  <footer style={{ marginTop: '4rem', paddingBottom: '2.5rem', textAlign: 'center', color: '#d1d5db' }}>
    <p>
      Powered by{' '}
      <a
        href='https://www.dub.sh/together-ai'
        target='_blank'
        rel='noopener noreferrer'
        style={{
          textDecoration: 'underline',
          textUnderlineOffset: '0.25rem',
          transition: 'color 0.2s',
          color: 'inherit',
        }}
      >
        Together.ai
      </a>{' '}
      &{' '}
      <a
        href='https://dub.sh/together-flux'
        target='_blank'
        rel='noopener noreferrer'
        style={{
          textDecoration: 'underline',
          textUnderlineOffset: '0.25rem',
          transition: 'color 0.2s',
          color: 'inherit',
        }}
      >
        Flux
      </a>
    </p>

    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <a href='https://github.com/Nutlope/blinkshot' target='_blank' rel='noopener noreferrer'>
          <Button
            variant='outline'
            size='sm'
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <GithubIcon style={{ width: '1rem', height: '1rem' }} />
            GitHub
          </Button>
        </a>
        <a href='https://x.com/nutlope' target='_blank' rel='noopener noreferrer'>
          <Button
            variant='outline'
            size='sm'
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <XIcon style={{ width: '1rem', height: '1rem' }} />
            Twitter
          </Button>
        </a>
      </div>
    </div>
    <Button onClick={downloadBook} style={{ marginTop: '1rem' }} disabled={isGeneratingDocx}>
      {isGeneratingDocx ? (
        <>
          <Spinner style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          Generating Document...
        </>
      ) : (
        <>
          <Download style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          Download Book
        </>
      )}
    </Button>
  </footer>
);

export default Footer;
