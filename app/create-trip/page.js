"use client";

import InputForm from "@/components/form/InputForm";

const CreateTrip = () => {
  return (
    <div className="w-full flex justify-center itemms-center py-4 px-4 lg:px-2">
      <main className="mt-32 relative inset-0">
        <div>
          <h1
            className="text-2xl md:text-3xl lg:text-5xl font-bold text-center 
          bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent"
          >
            Tell Us Your Travel Preferences
          </h1>
          <p className="text-center mx-auto px-2 mt-10 text-md text-gray-500">
            Just provide some basic information, and Trip Tailor will generate a
            customized itenerary just for you.
          </p>
        </div>
        <div className="mt-16 p-4 border rounded-2xl bg-slate-200/20">
          <InputForm />
        </div>
      </main>
    </div>
  );
};

export default CreateTrip;
