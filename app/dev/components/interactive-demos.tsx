"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipGroup } from "@/components/ui/chip";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ChipsDemo() {
  const [value, setValue] = useState(["שכונה א'", "שכונה ב'"]);
  return (
    <ChipGroup
      label="שכונות"
      options={["שכונה א'", "שכונה ב'", "שכונה ג'", "שכונה ד'"]}
      value={value}
      onChange={setValue}
    />
  );
}

const FEATURES = [
  { id: "parking", label: "חניה", checked: true },
  { id: "elevator", label: "מעלית", checked: true },
  { id: "balcony", label: "מרפסת", checked: false },
  { id: "safe-room", label: 'ממ"ד', checked: true },
  { id: "storage", label: "מחסן", checked: false },
];

export function CheckboxDemo() {
  return (
    <div className="flex flex-wrap gap-5">
      {FEATURES.map((f) => (
        <div key={f.id} className="flex items-center gap-2">
          <Checkbox id={`demo-${f.id}`} defaultChecked={f.checked} />
          <Label htmlFor={`demo-${f.id}`} className="font-normal">
            {f.label}
          </Label>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Checkbox id="demo-disabled" disabled />
        <Label htmlFor="demo-disabled" className="font-normal">
          לא זמין לבחירה
        </Label>
      </div>
    </div>
  );
}

export function RadioDemo() {
  return (
    <RadioGroup defaultValue="available" aria-label="סטטוס">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="available" id="demo-available" />
        <Label htmlFor="demo-available" className="font-normal">
          זמין
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="unavailable" id="demo-unavailable" />
        <Label htmlFor="demo-unavailable" className="font-normal">
          לא זמין
        </Label>
      </div>
    </RadioGroup>
  );
}

export function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="icon" size="icon" tone="danger" aria-label="מחיקה (דוגמה)">
          <Icon name="delete" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>מחיקת נכס</AlertDialogTitle>
        <AlertDialogDescription>
          למחוק את הנכס &quot;דירת 4 חדרים עם מרפסת&quot;? הנכס והתמונות שלו יימחקו, ולא ניתן לשחזר אותם.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="neutral" size="sm">
              ביטול
            </Button>
          </AlertDialogCancel>
          <AlertDialogCancel asChild>
            <Button size="sm" className="bg-error hover:bg-error/90">
              מחיקה
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
