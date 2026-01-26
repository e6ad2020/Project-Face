// import { motion } from "framer-motion"; 

export function RoutineTable() {
  const timeline = [
    { when: "Right away", goal: "Healthy Glow" },
    { when: "In 7 days", goal: "Softer Skin" },
    { when: "In 4 weeks", goal: "Less Wrinkles" },
  ];

  return (
    <div className="bg-transparent rounded-2xl border border-gray-800 overflow-hidden">
      <div className="grid grid-cols-2 text-center divide-x divide-gray-800 border-b border-gray-800 bg-transparent">
        <div className="p-3 text-lg font-normal text-gray-800">When?</div>
        <div className="p-3 text-lg font-normal text-gray-800">Goal</div>
      </div>

      <div className="divide-y divide-gray-800">
        {timeline.map((item, idx) => (
          <div key={idx} className="grid grid-cols-2 text-center divide-x divide-gray-800">
            <div className="p-4 text-gray-600 font-light text-lg">{item.when}</div>
            <div className="p-4 text-gray-600 font-light text-lg">{item.goal}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
