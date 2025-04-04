import { teachers, useAITeacher } from "@/hooks/useAITeacher";

export const BoardSettings = () => {
  const teacher = useAITeacher((state) => state.teacher);
  const setTeacher = useAITeacher((state) => state.setTeacher);
  const classroom = useAITeacher((state) => state.classroom);
  const setClassroom = useAITeacher((state) => state.setClassroom);

  return (
    <>
      <div className="absolute right-0 bottom-full flex flex-row gap-10 mb-20">
        {teachers.map((sensei, idx) => (
          <div
            key={idx}
            className={`p-3 transition-colors duration-500 ${teacher === sensei ? "bg-white/80" : "bg-white/40"}`}
          >
            <div onClick={() => setTeacher(sensei)}>
              <img
                src={`/images/${sensei}.jpg`}
                alt={sensei}
                className="object-cover w-40 h-40"
              />
            </div>
            <h2 className="text-3xl font-bold mt-3 text-center">{sensei}</h2>
          </div>
        ))}
      </div>
      <div className="absolute left-0 bottom-full flex flex-row gap-2 mb-20">
        <button
          className={`${
            classroom === "default" ? "text-white bg-slate-900/40" : "text-white/45 bg-slate-700/20"
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md`}
          onClick={() => setClassroom("default")}
        >
          Default classroom
        </button>
        <button
          className={`${
            classroom === "alternative" ? "text-white bg-slate-900/40" : "text-white/45 bg-slate-700/20"
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md`}
          onClick={() => setClassroom("alternative")}
        >
          Alternative classroom
        </button>
      </div>
    </>
  );
};
