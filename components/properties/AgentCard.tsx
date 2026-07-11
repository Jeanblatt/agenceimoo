import Image from "next/image";
import { Mail, MessageCircle, Phone, Star } from "lucide-react";
import type { Agent } from "@/data/agent";

interface AgentCardProps {
  agent: Agent;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AgentCard({ agent }: AgentCardProps) {
  const whatsappHref = `https://wa.me/${agent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Bonjour, je souhaite avoir des informations sur un bien.`
  )}`;

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-stone-50 p-6 ring-1 ring-stone-100 sm:flex-row sm:items-center sm:p-8">
      <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:text-center">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-stone-950 sm:h-20 sm:w-20">
          {agent.photo ? (
            <Image
              src={agent.photo}
              alt={agent.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-serif text-xl text-amber-400">
              {initialsOf(agent.name)}
            </span>
          )}
        </div>

        <div className="sm:hidden">
          <p className="font-serif text-lg text-stone-900">{agent.name}</p>
          <p className="text-sm text-stone-500">{agent.role}</p>
        </div>
      </div>

      <div className="flex-1">
        <div className="hidden sm:block">
          <p className="font-serif text-xl text-stone-900">{agent.name}</p>
          <p className="text-sm text-stone-500">{agent.role}</p>
        </div>

        {agent.rating !== undefined && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    index < Math.round(agent.rating!)
                      ? "fill-amber-500 text-amber-500"
                      : "text-stone-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-stone-600">{agent.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="mt-4 space-y-1.5 text-sm text-stone-600">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
            {agent.phone}
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
            {agent.email}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            href={`tel:${agent.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-stone-950 transition-transform hover:scale-[1.02]"
          >
            <Phone className="h-4 w-4" strokeWidth={2} />
            Appeler
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-stone-900 transition-colors hover:border-amber-500 hover:text-amber-600"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
