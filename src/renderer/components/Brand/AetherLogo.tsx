type AetherLogoProps = {
  alt?: string;
  className?: string;
  size?: number;
};

export default function AetherLogo({ alt = 'Aether', className = '', size = 32 }: AetherLogoProps) {
  return (
    <span
      aria-hidden={alt ? undefined : true}
      className={`block shrink-0 select-none overflow-hidden rounded-[22%] ${className}`}
      style={{ height: size, width: size }}
    >
      <img
        alt={alt}
        className="block h-full w-full scale-[1.045] object-cover"
        draggable={false}
        height={size}
        src="./aether-logo.png"
        width={size}
      />
    </span>
  );
}
