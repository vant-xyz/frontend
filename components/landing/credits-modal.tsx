"use client";

import { Button } from "@/components/ui/button";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const credits = [
    {
      category: "Hero Backdrop Video",
      name: "NIKNOK",
      link: "https://www.tiktok.com/@niknok000?_r=1&_t=ZS-94jrZiCDdt2",
    },
  ];

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Desktop Modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4">
        <div className="bg-black border border-black rounded-xl p-8 max-w-md w-full relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-white mb-2">Credits</h2>
          <p className="text-gray-400 text-sm mb-6">Acknowledgments and attributions</p>

          <div className="space-y-4">
            {credits.map((credit, index) => (
              <div
                key={index}
                className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg"
              >
                <p className="text-sm text-gray-500 mb-1">{credit.category}</p>
                {credit.link ? (
                  <a
                    href={credit.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-semibold hover:text-gray-300 transition-colors"
                  >
                    {credit.name} →
                  </a>
                ) : (
                  <p className="text-white font-semibold">{credit.name}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-800 text-gray-300 hover:bg-gray-900"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-black border-t border-black rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex justify-between items-center">
          <div />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Credits</h2>
        <p className="text-gray-400 text-sm mb-6">Acknowledgments and attributions</p>

        <div className="space-y-4">
          {credits.map((credit, index) => (
            <div
              key={index}
              className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg"
            >
              <p className="text-sm text-gray-500 mb-1">{credit.category}</p>
              {credit.link ? (
                <a
                  href={credit.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-semibold hover:text-gray-300 transition-colors"
                >
                  {credit.name} →
                </a>
              ) : (
                <p className="text-white font-semibold">{credit.name}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-800 text-gray-300 hover:bg-gray-900"
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
