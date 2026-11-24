'use client';

import { useState } from 'react';
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react';
import { useTeamT } from './useTeam';

/** Link de invitación con botón de copiar. Solo existe justo después de crear o reenviar. */
export function CopyLink({ link }: { link: string }) {
  const { tt } = useTeamT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el texto queda seleccionable en el campo
    }
  }

  return (
    <div className="join w-full">
      <input
        className="input input-bordered input-sm join-item w-full font-mono text-xs"
        value={link}
        readOnly
        aria-label={tt('invite.linkLabel')}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button type="button" className="btn btn-sm join-item" onClick={copy}>
        {copied ? <RiCheckLine className="size-4" aria-hidden="true" /> : <RiFileCopyLine className="size-4" aria-hidden="true" />}
        {copied ? tt('invite.copied') : tt('invite.copy')}
      </button>
    </div>
  );
}
