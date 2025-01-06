import React from 'react';

type DashboardTitleProps = {
  title: string;
  subtitle: string;
  align?: 'left' | 'center' | 'right';
};

const DashboardTitle: React.FC<DashboardTitleProps> = ({ title, subtitle, align = 'left' }) => {
  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <div className={`mb-4 md:mb-6 flex flex-col gap-1 ${alignmentClasses[align]}`}>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-heading">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl text-medical-800">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default DashboardTitle;
