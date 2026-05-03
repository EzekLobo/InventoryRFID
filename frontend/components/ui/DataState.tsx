import { AlertCircle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Carregando dados" }: { label?: string }) {
  return (
    <div className="state-box">
      <Loader2 className="spin" size={20} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-box error">
      <AlertCircle size={20} />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="state-box">{label}</div>;
}
