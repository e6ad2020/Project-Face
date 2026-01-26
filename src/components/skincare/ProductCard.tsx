import { motion } from "framer-motion";

interface ProductCardProps {
  name: string;
  description: string;
  image: string;
  price: string;
  delay?: number;
  onImageClick?: () => void;
  onClick?: () => void;
}

export function ProductCard({ name, description, image, price, delay = 0, onImageClick, onClick }: ProductCardProps) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-[2.5rem] p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center relative group hover:shadow-lg transition-shadow h-full cursor-pointer"
      onClick={onClick}
    >
      <div
        className="w-full h-48 bg-white rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden shrink-0 border-2 border-gray-50 cursor-zoom-in"
        onClick={(e) => {
          e.stopPropagation();
          onImageClick?.();
        }}
      >
        <img src={image} alt={name} className="h-full w-auto object-contain p-2" />
      </div>

      <div className="flex flex-col items-center w-full gap-2 flex-1">
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{description}</p>

        <div className="mt-auto inline-block rounded-full bg-[image:var(--gradient-button)] px-6 py-2 text-white text-sm font-bold shadow-md shadow-orange-100">
          {price}
        </div>
      </div>
    </motion.div>
  );
}
