import { useState, useRef, useLayoutEffect, type ImgHTMLAttributes } from 'react';
import { Utensils } from 'lucide-react';

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  showSkeleton?: boolean;
}

const loadedImageUrls = new Set<string>();

export default function Image({
  src,
  alt = '',
  fill,
  priority,
  className = '',
  sizes,
  loading,
  style,
  showSkeleton = true,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(() => Boolean(src && loadedImageUrls.has(src)));
  const [hasError, setHasError] = useState(false);
  const fillClass = fill ? 'absolute inset-0 w-full h-full' : '';
  const loadMode = priority ? 'eager' : (loading || 'lazy');

  useLayoutEffect(() => {
    setHasError(false);
    if (!src) {
      setIsLoaded(false);
      return;
    }
    if (loadedImageUrls.has(src)) {
      setIsLoaded(true);
      return;
    }
    const imgEl = imgRef.current;
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      loadedImageUrls.add(src);
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`${fillClass} flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 text-zinc-400 p-3 select-none`}
        role="img"
        aria-label={alt || 'PANNELLO'}
      >
        <Utensils className="w-6 h-6 text-[#C8102E]/80 mb-1" />
        {alt && <span className="text-[11px] font-heading font-bold text-zinc-300 text-center line-clamp-1">{alt}</span>}
      </div>
    );
  }

  return (
    <>
      {showSkeleton && !isLoaded && (
        <div
          className={`shimmer-skeleton absolute inset-0 z-0 bg-[var(--bg-surface-elevated)] pointer-events-none transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loadMode}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        onLoad={(e) => {
          if (src) {
            loadedImageUrls.add(src);
          }
          setIsLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        className={`${fillClass} ${className} ${
          showSkeleton ? `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}` : ''
        }`.trim()}
        style={style}
        sizes={sizes}
        {...props}
      />
    </>
  );
}
