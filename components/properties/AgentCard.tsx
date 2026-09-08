import Image from "next/image";
import { Mail, MessageCircle, Phone, Star } from "lucide-react";
import type { Agent } from "@/data/agent";
import { agency } from "@/config/agency";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { initialsOf } from "@/lib/initials";

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  // Numéro WhatsApp dédié de l'agence (peut différer du téléphone affiché
  // ci-dessous) — corrigé en V3.3.G, voir agency.whatsapp dans config/agency.ts.
  const whatsappHref = `https://wa.me/${agency.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Bonjour, je souhaite avoir des informations sur un bien.`
  )}`;

  return (
    <Card tone="muted" ring="subtle" padding="sm" className="flex flex-col gap-6 sm:flex-row sm:items-center sm:p-8">
      <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:text-center">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-ink sm:h-20 sm:w-20">
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
          <Button href={`tel:${agent.phone}`} size="compact" className="flex-1">
            <Phone className="h-4 w-4" strokeWidth={2} />
            Appeler
          </Button>
          <Button
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            tone="onLight"
            size="compact"
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            WhatsApp
          </Button>
        </div>
      </div>
    </Card>
  );
}
