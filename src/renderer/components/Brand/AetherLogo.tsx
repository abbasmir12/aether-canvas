type AetherLogoProps = {
  alt?: string;
  className?: string;
  size?: number;
};

export default function AetherLogo({ alt = 'Aether', className = '', size = 32 }: AetherLogoProps) {
  return (
    <img
      alt={alt}
      className={`block shrink-0 select-none object-contain ${className}`}
      draggable={false}
      height={size}
      src="/aether-logo.png"
      width={size}
    />
  );
}
