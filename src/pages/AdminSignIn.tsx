import { Component } from "@/components/ui/sign-in-card-2";
import { Tiles } from "@/components/ui/tiles";

export default function AdminSignIn() {
  return (
    <div className="relative flex w-full h-screen justify-center items-center overflow-hidden">
      {/* Tiles Background - positioned behind everything */}
      <div className="absolute inset-0 z-0">
        <Tiles 
          rows={50} 
          cols={20}
          tileSize="md"
          className="opacity-30"
          tileClassName="border-white/10"
        />
      </div>
      
      {/* Sign-in card - positioned above the tiles */}
      <div className="relative z-10">
        <Component />
      </div>
    </div>
  );
}