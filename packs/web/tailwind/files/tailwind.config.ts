import type { Config } from 'tailwindcss';

// 스캐폴드(ccx) — 프로젝트 소유. 의미 토큰(theme)을 SoT로, 모바일 퍼스트로 확장한다.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3E26FD',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EE3D3D',
          foreground: '#FFFFFF',
        },
        border: '#CCCCCC',
        background: '#FFFFFF',
        foreground: '#000000',
      },
      borderRadius: {
        card: '12px',
        pill: '44px',
      },
    },
  },
  plugins: [],
};

export default config;
