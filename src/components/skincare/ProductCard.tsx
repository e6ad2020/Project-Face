import { motion } from "framer-motion";

interface ProductCardProps {
  name: string;
  description: string;
  image: string;
  price: string;
  delay?: number;
}

export function ProductCard({ name, description, image, price, delay = 0 }: ProductCardProps) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center h-full relative overflow-hidden group hover:shadow-lg transition-shadow"
    >
      <div className="w-full aspect-[4/4] bg-gray-50 rounded-2xl mb-6 relative overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover mix-blend-multiply p-4" />
      </div>

      <div className="flex-1 flex flex-col justify-between w-full gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">{name}</h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{description}</p>
        </div>

        <div className="mt-auto pt-2">
          <div className="inline-block rounded-full bg-[image:var(--gradient-button)] px-6 py-2 text-white text-sm font-bold shadow-md shadow-orange-100">
            {price}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
