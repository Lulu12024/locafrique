
import React, { useEffect, useRef } from "react";
import { 
  Carousel, 
  CarouselApi, 
  CarouselContent, 
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

interface AutoplayCarouselProps {
  className?: string;
  children: React.ReactNode;
  autoplayInterval?: number;
  loop?: boolean;
}

export const AutoplayCarousel: React.FC<AutoplayCarouselProps> = ({ 
  className, 
  children, 
  autoplayInterval = 5000, 
  loop = true
}) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    // Reset when api is available
    const handleSelect = () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }

      if (autoplayInterval > 0) {
        intervalRef.current = setTimeout(() => {
          if (api.canScrollNext()) {
            api.scrollNext();
          } else if (loop) {
            api.scrollTo(0);
          }
        }, autoplayInterval);
      }
    };

    api.on("select", handleSelect);

    // Init
    handleSelect();

    return () => {
      api.off("select", handleSelect);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [api, autoplayInterval, loop]);

  return (
    <Carousel setApi={setApi} className={className}>
      {children}
    </Carousel>
  );
};

export { CarouselContent, CarouselItem, CarouselNext, CarouselPrevious };
