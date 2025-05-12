import { InputSideButton } from "@/hooks/generate/schemas";

export const funcButtons: InputSideButton[] = [
  {
    title: "Insert",
    icon: "",
    type: "dropdown",
    values: [
      {
        title: "Functions",
        type: "group",
        values: [
          {
            insert: true,
            title: "Random number",
            type: "value",
            value: "rand()",
          },
          {
            insert: true,
            title: "Random string",
            type: "value",
            value: "randstr()",
          },
          {
            insert: true,
            title: "Convert to HEX",
            type: "value",
            value: "hex()",
          },
          {
            insert: true,
            title: "Conver to OCT",
            type: "value",
            value: "oct()",
          },
          {
            insert: true,
            title: "To UPPER case",
            type: "value",
            value: "uc()",
          },
          {
            insert: true,
            title: "To lower case",
            type: "value",
            value: "lc()",
          },
          {
            insert: true,
            title: "Remove delimiters",
            type: "value",
            value: "no_delimiters()",
          },
        ],
      },
      {
        title: "Variables",
        type: "group",
        values: [
          {
            insert: true,
            title: "MAC address",
            type: "value",
            value: "$MAC$",
          },
        ],
      },
    ],
  },
];
