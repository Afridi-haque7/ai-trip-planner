'use client'

function Restricted() {
    return (
      <div className="mt-48">
        <main className="flex justify-center item-center">
          <p className="text-xl font-semibold">
            The Page is <span className="text-red-800">Restricted</span> for Unauthorized Users
          </p>
        </main>
      </div>
    );
}

export default Restricted;