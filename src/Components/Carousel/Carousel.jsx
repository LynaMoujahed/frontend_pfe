import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import img1 from "../../assets/img1.jpg";
import img2 from "../../assets/img2.jpg";
import img3 from "../../assets/img3.jpg";

// Style pour les animations
const carouselStyles = `
  @keyframes zoomEffect {
    0% {
      transform: scale(1);
    }
    30% {
      transform: scale(1.01);
    }
    70% {
      transform: scale(1.02);
    }
    100% {
      transform: scale(1.03);
    }
  }

  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.8s ease-out forwards;
  }

  .animation-delay-300 {
    animation-delay: 0.3s;
  }

  .animation-delay-600 {
    animation-delay: 0.6s;
  }
`;

const slides = [
  {
    image: img1,
    title: "Évaluation Précise",
    subtitle: "pour les Futurs Experts",
    description: "Pharmaceutiques!",
  },
  {
    image: img2,
    title: "Transformez Votre Carrière",
    subtitle: "Pharmaceutique – Cours Dirigés",
    description: "par des Experts!",
  },
  {
    image: img3,
    title: "Suivez Votre Progression",
    subtitle: "et Réussissez avec des",
    description: "Évaluations Personnalisées!",
  },
];

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  const goToSlide = (index) => setCurrentIndex(index);
  const goToPrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % slides.length);

  return (
    <>
      <style>{carouselStyles}</style>
      <div
        className="relative w-screen h-[40rem] overflow-hidden shadow-2xl -mx-[calc((100vw-100%)/2)] border-b border-blue-900/20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Slides */}
        <div className="relative h-full w-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1500 ease-in-out ${
                index === currentIndex
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-102"
              }`}
            >
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover object-center transform transition-transform duration-10000 ease-in-out will-change-transform"
                style={{
                  filter: "brightness(0.85) contrast(1.15) saturate(1.1)",
                  animation:
                    index === currentIndex
                      ? "zoomEffect 35s cubic-bezier(0.1, 0.1, 0.25, 1) forwards"
                      : "none",
                }}
              />
              {/* Dark overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

              {/* Text overlay - LEFT ALIGNED */}
              <div className="absolute inset-0 flex items-center">
                <div className="px-16 max-w-3xl text-white ml-8">
                  <h1 className="text-5xl md:text-6xl font-bold mb-5 drop-shadow-xl text-white animate-fadeInUp">
                    {slide.title}
                  </h1>
                  <h1 className="text-4xl md:text-5xl font-bold mb-5 drop-shadow-xl text-blue-100 animate-fadeInUp animation-delay-300">
                    {slide.subtitle}
                  </h1>
                  <h1 className="text-3xl md:text-4xl font-bold mb-5 drop-shadow-xl text-white/90 animate-fadeInUp animation-delay-600">
                    {slide.description}
                  </h1>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all shadow-md ${
                currentIndex === index
                  ? "bg-blue-500 w-8"
                  : "bg-white/70 hover:bg-blue-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 bg-blue-600/40 hover:bg-blue-600/70 text-white p-3 rounded-full z-10 transition-all duration-300 shadow-lg transform hover:scale-110"
          aria-label="Previous slide"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-blue-600/40 hover:bg-blue-600/70 text-white p-3 rounded-full z-10 transition-all duration-300 shadow-lg transform hover:scale-110"
          aria-label="Next slide"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

export default Carousel;
