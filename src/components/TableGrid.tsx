import { motion } from "framer-motion";
interface TableGridProps {
  onTableSelect: (tableNumber: number) => void;
  selectedTable: number | null;
}

const TableGrid = ({ onTableSelect, selectedTable }: TableGridProps) => {
  const tables = Array.from({ length: 20 }, (_, i) => i + 1);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div 
      className="table-grid mb-[250px] mt-[30px]"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {tables.map((table) => (
        <motion.div
          key={table}
          variants={itemVariants}
          className={`table-card h-[50px] w-[120px] aspect-square ${selectedTable === table ? "selected" : ""}`}
          onClick={() => onTableSelect(table)}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xl md:text-2xl font-cairo font-bold">{table}</span>
          {selectedTable === table && (
            <motion.div
              className="absolute inset-0  w-full h-full bg-gold z-[-10] rounded-xl "
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              layoutId="selectedTable"
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TableGrid;
