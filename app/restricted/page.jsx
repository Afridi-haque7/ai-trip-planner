'use client'

function Restricted() {
    return (
      <div className="mt-32">
        <main className="flex justify-center item-center">
          <div className=" flex flex-col gap-12 justify-center items-center">
            <h1 className="text-red-500 text-4xl font-bold ">Restricted</h1>
            <div className="text-white flex flex-col gap-4 justify-center items-center bg-white/10 px-8 py-12 rounded-lg">
              <p className="text-xl font-semibold">
                Sorry, You are not authrized to access this page 😕
              </p>
              <p className="text-xl font-semibold">Please SignIn first</p>
            </div>
          </div>
        </main>
      </div>
    );
}

export default Restricted;