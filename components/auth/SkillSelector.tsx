import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/theme";
import { SKILLS } from "@/constants/skills";

type Props = {
  value: string[];
  onChange: (skills: string[]) => void;
};

export default function SkillSelector({
  value,
  onChange,
}: Props) {
  function toggleSkill(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Select Your Skills
      </Text>

      <Text style={styles.subHeading}>
        Choose one or multiple skills.
      </Text>

      <View style={styles.grid}>
        {SKILLS.map((skill) => {
          const selected = value.includes(skill.id);

          return (
            <TouchableOpacity
              key={skill.id}
              activeOpacity={0.9}
              onPress={() =>
                toggleSkill(skill.id)
              }
              style={[
                styles.card,
                selected &&
                  styles.selectedCard,
              ]}
            >
              <View style={styles.topRow}>
                <Text style={styles.emoji}>
                  {skill.emoji}
                </Text>

                <Ionicons
                  name={
                    selected
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={22}
                  color={
                    selected
                      ? COLORS.primary
                      : "#94A3B8"
                  }
                />
              </View>

              <Text
                style={[
                  styles.title,
                  selected && {
                    color:
                      COLORS.primary,
                  },
                ]}
              >
                {skill.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },

  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  subHeading: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 18,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,

    borderWidth: 1,
    borderColor: "#E5E7EB",

    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: "#EEF4FF",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  emoji: {
    fontSize: 32,
  },

  title: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
});