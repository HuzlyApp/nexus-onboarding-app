"use client"

export default function Sidebar() {
  return (
    <div className="w-[260px] bg-[#0F3D3E] text-white h-screen p-6 flex flex-col">
      <div className="text-2xl font-bold mb-10">✳</div>

      <div className="space-y-6">
        <div>
          <p className="text-xs opacity-70 mb-2">PERSONAL SETTINGS</p>
          <div className="space-y-2">
            <div className="cursor-pointer">Profile</div>
            <div className="cursor-pointer">Account</div>
          </div>
        </div>

        <div>
          <p className="text-xs opacity-70 mb-2">TEAM MANAGEMENT</p>
          <div className="space-y-2">
            <div className="font-semibold">Candidates</div>
            <div className="ml-3 text-sm opacity-80">All</div>
            <div className="ml-3 text-sm opacity-80">New</div>
            <div className="ml-3 text-sm bg-white text-black px-2 py-1 rounded">
              Pending
            </div>
            <div className="ml-3 text-sm opacity-80">Approved</div>
            <div className="ml-3 text-sm opacity-80">Disapproved</div>
          </div>
        </div>
      </div>
    </div>
  )
}