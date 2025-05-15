// components/AppLoader.tsx
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  Binary,
  Blocks,
  Code,
  Database,
  FileCode,
  Server,
  Table,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface AnimatedIcon {
  icon: React.ReactNode;
  position: { x: number; y: number };
  rotation: number;
  speed: { x: number; y: number };
  rotationSpeed: number;
}

const AppLoader: React.FC = () => {
  const [icons, setIcons] = useState<AnimatedIcon[]>([]);

  useEffect(() => {
    // Create 8 randomly positioned icons
    const initialIcons: AnimatedIcon[] = [
      { Icon: Activity },
      { Icon: Database },
      { Icon: Server },
      { Icon: Code },
      { Icon: Table },
      { Icon: FileCode },
      { Icon: Blocks },
      { Icon: Binary },
    ].map(({ Icon }) => ({
      icon: (
        <Icon
          size={256}
          stroke="white"
          strokeWidth={1.5}
        />
      ),
      position: {
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100),
      },
      rotation: Math.random() * 360,
      speed: {
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
      },
      rotationSpeed: (Math.random() - 0.5) * 0.5,
    }));

    setIcons(initialIcons);

    // Animation loop
    const animationFrame = requestAnimationFrame(function animate() {
      setIcons((prevIcons) =>
        prevIcons.map((icon) => {
          // Update position
          let newX = icon.position.x + icon.speed.x;
          let newY = icon.position.y + icon.speed.y;

          // Bounce off edges
          if (newX <= 0 || newX >= window.innerWidth - 64) {
            icon.speed.x *= -1;
            newX = Math.max(0, Math.min(newX, window.innerWidth - 64));
          }
          if (newY <= 0 || newY >= window.innerHeight - 64) {
            icon.speed.y *= -1;
            newY = Math.max(0, Math.min(newY, window.innerHeight - 64));
          }

          // Update rotation
          const newRotation = (icon.rotation + icon.rotationSpeed) % 360;

          return {
            ...icon,
            position: { x: newX, y: newY },
            rotation: newRotation,
          };
        })
      );

      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-200 z-40 overflow-hidden flex items-center justify-center">
      <Alert className="max-w-[400px] space-y-2 pb-4 z-50">
        <Database className="h-4 w-4" />
        <AlertTitle className="text-xl">Loading local data</AlertTitle>
        <AlertDescription>
          Shhh... this is a secret message! Good job finding it I guess. Now go
          on, away with you.
        </AlertDescription>
      </Alert>
      {icons.map((icon, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: `${icon.position.x}px`,
            top: `${icon.position.y}px`,
            transform: `rotate(${icon.rotation}deg)`,
            transition: "transform 0.5s ease-out",
          }}
        >
          {icon.icon}
        </div>
      ))}
    </div>
  );
};

export default AppLoader;
