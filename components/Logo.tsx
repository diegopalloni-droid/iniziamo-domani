import React from 'react';

interface LogoProps {
  onClick?: () => void;
}

const HexagonIcon: React.FC = () => (
  <svg className="h-8 w-auto" viewBox="0 0 54 62" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27 0L53.9411 15.5V46.5L27 62L0.0588741 46.5V15.5L27 0Z" fill="#00843D"/>
      <path d="M27 5.09375L49.0192 17.5469V44.4531L27 56.9062L4.98077 44.4531V17.5469L27 5.09375Z" fill="white"/>
  </svg>
);


export const Logo: React.FC<LogoProps> = ({ onClick }) => (
  <div 
    onClick={onClick} 
    className={`font-sans ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center gap-2">
      <HexagonIcon />
      <span style={{color: '#00843D'}} className="font-bold italic text-4xl tracking-tight">intertec</span>
    </div>
    <p className="font-caveat text-gray-500 text-lg -mt-1 ml-9 tracking-wide">
      driven by nature creating excellence
    </p>
  </div>
);