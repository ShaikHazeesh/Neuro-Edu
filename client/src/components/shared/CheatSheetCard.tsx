import { motion } from "framer-motion";

interface CheatSheet {
  id: number;
  title: string;
  level: string;
  topics: string[];
  downloadUrl: string;
  color: "primary" | "secondary" | "accent";
}

interface CheatSheetCardProps {
  cheatSheet: CheatSheet;
}

const CheatSheetCard = ({ cheatSheet }: CheatSheetCardProps) => {
  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden"
      whileHover={{ y: -3, scale: 1.01, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
    >
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="font-outfit font-semibold">{cheatSheet.title}</h3>
          <div className={`bg-${cheatSheet.color}/10 dark:bg-${cheatSheet.color}/20 text-${cheatSheet.color} dark:text-${cheatSheet.color} text-xs px-2 py-1 rounded-full`}>
            {cheatSheet.level}
          </div>
        </div>
      </div>
      <div className="p-5">
        <ul className="space-y-3 text-sm">
          {cheatSheet.topics.map((topic, index) => (
            <li key={index} className="flex items-center">
              <span className={`material-icons text-${cheatSheet.color} text-sm mr-2`}>check_circle</span>
              {topic}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
        <a 
          href={cheatSheet.downloadUrl}
          className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText py-2 rounded-standard font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
          download
        >
          <span className="material-icons text-sm mr-2">download</span> Download PDF
        </a>
      </div>
    </motion.div>
  );
};

export default CheatSheetCard;
