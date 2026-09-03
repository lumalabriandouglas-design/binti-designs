import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getStudioData, saveSettings } from "@/lib/server/boutique";
import { getStudioToken } from "@/lib/bag";
import { BananaLoader } from "@/components/minion";

export const Route = createFileRoute("/studio/settings")({ component: SettingsPage });

function SettingsPage() {
  const token = typeof window !== "undefined" ? getStudioToken() : "";
  const q = useQuery({
    queryKey: ["studio", token],
    queryFn: () => getStudioData({ data: { token } }),
    enabled: Boolean(token),
  });
  const s = q.data?.settings;
  const [brand, setBrand] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [pay, setPay] = useState("");
  const [ig, setIg] = useState("");
  const [drape, setDrape] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [pin, setPin] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!s) return;
    setBrand(s.brand_name);
    setTagline(s.tagline);
    setAbout(s.about);
    setWhatsapp(s.whatsapp);
    setPhone(s.phone);
    setPay(s.payment_phone);
    setIg(s.instagram);
    setDrape(s.drape_url);
    setAdminEmail(s.admin_email || "bintidesigns442@gmail.com");
  }, [s]);

  const save = useMutation({
    mutationFn: () =>
      saveSettings({
        data: {
          token,
          brand_name: brand,
          tagline,
          about,
          whatsapp,
          phone,
          payment_phone: pay,
          instagram: ig,
          drape_url: drape,
          admin_email: adminEmail,
          new_pin: pin || undefined,
        },
      }),
    onSuccess: () => {
      setNote("House notes saved.");
      setPin("");
      q.refetch();
    },
    onError: (e) => setNote(e.message),
  });

  if (!token) {
    return <p className="px-5 py-16 text-sm text-[#f0d24b]">Enter the studio pin first.</p>;
  }
  if (q.isLoading) return <BananaLoader label="Reading the house book" />;

  return (
    <form
      className="mx-auto max-w-xl space-y-4 px-5 py-10"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#f0d24b]">
        House
      </p>
      <h1 className="display text-5xl text-paper">Her numbers</h1>
      <p className="text-sm leading-relaxed text-paper/55">
        WhatsApp becomes a button on the public site. Payment number is shown
        on inquiries until Flutterwave is connected.
      </p>
      {(
        [
          ["House name", brand, setBrand],
          ["Line", tagline, setTagline],
          ["WhatsApp number", whatsapp, setWhatsapp],
          ["Contact phone", phone, setPhone],
          ["Payment number", pay, setPay],
          ["Instagram URL", ig, setIg],
          ["Drapé showroom URL", drape, setDrape],
        ] as const
      ).map(([label, value, set]) => (
        <label key={label} className="block text-xs uppercase tracking-[0.16em] text-paper/45">
          {label}
          <input
            value={value}
            onChange={(e) => set(e.target.value)}
            className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-paper outline-none"
          />
        </label>
      ))}
      <label className="block text-xs uppercase tracking-[0.16em] text-paper/45">
        House email — only this account opens the floor
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-paper outline-none"
        />
      </label>
      <label className="block text-xs uppercase tracking-[0.16em] text-paper/45">
        About
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          className="mt-2 h-32 w-full border border-white/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-paper outline-none"
        />
      </label>
      <label className="block text-xs uppercase tracking-[0.16em] text-paper/45">
        New studio pin — leave blank to keep
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-sm tracking-[0.3em] text-paper outline-none focus:border-[#f0d24b]"
        />
      </label>
      <button
        type="submit"
        className="bg-[#f0d24b] px-6 py-3 text-[0.7rem] tracking-[0.2em] uppercase text-[#161412]"
      >
        Save house
      </button>
      {note ? <p className="text-sm text-[#f0d24b]">{note}</p> : null}
    </form>
  );
}
