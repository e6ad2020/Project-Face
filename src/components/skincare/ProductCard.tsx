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
      className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center h-full relative overflow-hidden group hover:shadow-lg transition-shadow"
    >
      <div className="w-full aspect-[4/5] bg-gray-50 rounded-xl mb-4 relative overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover mix-blend-multiply" />
      </div>
      
      <div className="flex-1 flex flex-col justify-between w-full">
        <div>
           <h3 className="font-semibold text-gray-900 text-xs mb-1 min-h-[2.5em] leading-tight">{name}</h3>
           <p className="text-[10px] text-gray-500 leading-tight mb-3 line-clamp-3">{description}</p>
        </div>
        
        <div className="mt-auto">
          <div className="inline-block rounded-full bg-[image:var(--gradient-button)] px-4 py-1.5 text-white text-xs font-bold shadow-md shadow-orange-100">
            {price}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
