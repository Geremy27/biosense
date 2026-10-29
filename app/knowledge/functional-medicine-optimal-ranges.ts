/**
 * Optimal lab ranges for functional medicine practice.
 *
 * Source: "Paraclinicos Para Medico Funcional" reference document.
 *
 * These are NOT standard laboratory reference ranges — they are the tighter,
 * functional-medicine optimal ranges used to identify sub-optimal values that
 * may still fall within conventional "normal" limits.
 *
 * Usage: inject FUNCTIONAL_MEDICINE_OPTIMAL_RANGES_TEXT into the lab-extraction
 * system/user prompt so the LLM can populate the `optimalRange` and `flag`
 * fields accordingly.
 */
export const FUNCTIONAL_MEDICINE_OPTIMAL_RANGES_TEXT = `
## Rangos Óptimos de Medicina Funcional (referencia interna — NO son rangos de laboratorio convencionales)

Usa esta tabla para completar el campo "optimalRange" de cada analito extraído del informe.
Busca el analito por nombre (ignora mayúsculas/minúsculas y tildes, acepta sinónimos).
Si el paciente es mujer u hombre y existen filas separadas, usa la fila correspondiente al sexo del paciente cuando sea conocido; si no lo es, incluye ambas.
Cuando el valor del paciente esté fuera del rango óptimo, marca el campo "flag" como "FUERA DE RANGO ÓPTIMO".
Si el valor está dentro del rango de referencia del laboratorio pero fuera del rango óptimo, marca "flag" como "SUBÓPTIMO".
Si el valor está dentro del rango óptimo, deja "flag" en null.

### Cuadro Hemático
- Eritrocitos: 4.8–5 millones/µL
- Hemoglobina (Mujer): 13.5–14.5 g/dL
- Hemoglobina (Hombre): 14–15 g/dL
- Hematocrito (Mujer): 0.39–0.44
- Hematocrito (Hombre): 0.42–0.45
- HCM: 28–32 pg
- CHCM: 32–36 g/dL
- VCM: 90–95 fL
- ADE / RDW: 0.125–0.135
- Leucocitos: 5–7.5 miles/µL
- Neutrófilos (%): 60–65%
- Linfocitos (%): 30–40%
- Monocitos (%): 4–5%
- Eosinófilos (%): 0–2%
- Basófilos (%): <1%
- Neutrófilos (absoluto): 2.5–5 miles/µL
- Linfocitos (absoluto): 2–3 millones/µL
- Relación neutrofilo/linfocito (NLR): 1–2
- Monocitos (absoluto): 0.4–0.6 miles/µL
- Eosinófilos (absoluto): 0–0.2 miles/µL
- Basófilos (absoluto): 0–0.095 miles/µL
- Plaquetas: 200–250 miles/µL
- Volumen Plaquetario Medio (VPM): 9.5–10 fL

### Materia Fecal
- Cristales de Charcot-Leyden en coproscópico: valor esperado = negativo (positivo sugiere parasitosis)
- pH fecal: óptimo 7 (< 6 posible SIBO; > 8 posible disbiosis)
- Antígeno Fecal H. Pylori: negativo
- Azúcares reductores en coproscópico: negativo (positivo indica malabsorción intestinal / IPE)
- Elastasa pancreática: óptimo > 500 µg/g (200–300: IPE leve; < 200: IPE moderada; < 100: IPE severa)
- Calprotectina: < 50 µg/g (normal); < 120 µg/g (elevada)
- Zonulina: < 175 ng/g

### Hormonas — Mujeres (pre y postmenopáusicas, general)
- DHEA-S (mujer): 200–480 µg/dL (ideal: 280)
- Testosterona Libre (mujer): 5–15 pg/mL (ideal: 8)
- Testosterona Total (mujer): 0.25–0.5 ng/mL o 25–50 ng/dL (ideal: > 35 ng/dL)
- Dihidrotestosterona (mujer): 180–350 pg/mL (ideal: 250)
- Androstenediona (mujer): 0.4–2.5 ng/mL (ideal: 2)
- 17-OH Progesterona (mujer): 20–100 ng/dL (ideal: 40–80)
- Hormona Antimulleriana (mujer): 0.25–0.5 ng/mL (ideal: 0.35)

### Hormonas — Mujeres premenopáusicas con ciclos
- FSH día 2–3: 2–13 mUI/mL (ideal: 3–5)
- FSH día 13–14: 5–40 mUI/mL (ideal: 7–20)
- FSH día 21: 1.5–8 mUI/mL (ideal: 2–5)
- LH día 3–5: 2–12 mUI/mL (ideal: 2–10)
- LH día 13–14: 35–105 mUI/mL (ideal: 70)
- LH/FSH día 3–5: 1–2 (ideal: 1.1)
- Estradiol (E2) día 3–5: 50–101 pg/mL (ideal: 65–90)
- Estradiol (E2) día 13–14 (pico ovulatorio): 300–800 pg/mL (ideal: 650)
- Estradiol (E2) día 21 (fase lútea): 100–210 pg/mL (ideal: 150)
- Estrona (E1) día 21: 60–200 pg/mL (ideal: 130)
- Progesterona día 21: 13–23 ng/mL

### Hormonas — Mujeres postmenopáusicas
- FSH (postmenopausia): 20–138 mUI/mL (ideal: 20–50)
- LH (postmenopausia): 15–60 mUI/mL (ideal: 15–30)
- Estradiol (postmenopausia): 80–150 pg/mL (con TRH: 70 pg/mL mínimo)
- Estrona (postmenopausia): 80–150 pg/mL
- Progesterona (postmenopausia): 5–8 ng/mL

### Hormonas — Hombres
- LH (hombre): 2–12 mUI/mL (ideal: 3)
- FSH (hombre): 1–8 mUI/mL (ideal: 2)
- DHEA-S (hombre): 300–600 µg/dL (ideal: 400)
- Testosterona Libre (hombre): 50–250 µg/dL o > 18 ng/mL (ideal: 25–30 ng/mL)
- Testosterona Total (hombre): 550–1000 ng/dL (ideal: 800–900)
- Dihidrotestosterona (hombre): 50–100 ng/dL (ideal: 70)
- Estradiol (hombre): 10–35 pg/mL (ideal: 25)
- Estrona (hombre): 20–35 pg/mL (ideal: 30)

### Química Sanguínea
- 25(OH) Vitamina D3: ≥ 50 ng/mL (óptimo funcional; convencional ≥ 30)
- Ácido Úrico (mujer): 3–4 mg/dL
- Ácido Úrico (hombre): 4–5 mg/dL
- Albúmina: 4.3–4.8 g/dL
- Albúmina/Globulina: 1.5–2
- ALT (TGP): 12–25 U/L
- ANAS (título): < 1:40
- Anticuerpos Anti-peroxidasa (anti-TPO): 0–34 UI/mL
- Anticuerpos Anti-tiroglobulina: 0–40 UI/mL
- ApoA1 (mujer): 115–205 mg/dL
- ApoA1 (hombre): 120–180 mg/dL
- ApoB: 40–100 mg/dL
- ApoB/ApoA1: < 0.8
- AST (TGO): 15–25 U/L
- Bicarbonato: 23–27 mEq/L
- Bilirrubina directa (conjugada): 0.1–0.2 mg/dL
- Bilirrubina indirecta (no conjugada): 0.4–0.8 mg/dL
- Bilirrubina total: 0.5–0.8 mg/dL
- Brecha Aniónica (anion gap): 8–14 mEq/L
- BUN (nitrógeno ureico): 11–15 mg/dL
- Calcio sérico: 9.4–9.8 mg/dL
- Capacidad total de fijación del hierro (TIBC): 300–350 µg/dL
- CD4/CD8: < 1.3 sugiere infección viral crónica; > 2 sugiere infección bacteriana/micótica/parasitaria
- Ceruloplasmina: 20–35 mg/dL
- Cloro sérico: 100–105 mEq/L
- Colesterol Total: 180–200 mg/dL
- Colesterol Total/HDL: < 3.3
- Cortisol Total Sérico 7–9 am: 100–200 ng/mL (óptimo: 180)
- Cortisol Libre Sérico 7–9 am: 13–30 ng/mL (óptimo: 20)
- Cortisol Total Sérico 4–8 pm: 30–100 ng/mL (óptimo: 45)
- Cortisol Libre Sérico 4–8 pm: 7–20 ng/mL (óptimo: 10–12)
- Cortisol en Saliva Mañana: 10–45 nmol/L (óptimo: 20–30)
- Cortisol en Saliva Mediodía: 5–16 nmol/L (óptimo: 7–11)
- Cortisol en Saliva Tarde: 4–12 nmol/L (óptimo: 6–9)
- Cortisol en Saliva Noche: 2.5–9 nmol/L (óptimo: 5)
- Creatinina (mujer): 0.65–0.9 mg/dL
- Creatinina (hombre): 0.85–1.1 mg/dL
- Creatinkinasa (CK): 60–80 U/L
- Cobre Sérico: 81–130 µg/dL
- Cobre/Zinc: 0.8–1.2
- Fibrinógeno: 175–300 mg/dL
- Ferritina (mujer): 70–100 ng/mL
- Ferritina (hombre): 100–200 ng/mL
- Folato Sérico: > 8 ng/mL
- Fosfatasa Alcalina (FA): 50–75 U/L
- GGT: 15–30 U/L
- Globulina Sérica: 2.2–2.4 g/dL
- SHBG / Globulina transportadora de hormonas sexuales (mujer): 40–80 nmol/L (ideal: 65)
- SHBG / Globulina transportadora de hormonas sexuales (hombre): 20–55 nmol/L (ideal: 25–30)
- Glucosa en Ayuno (glicemia): 80–87 mg/dL
- Glucosa postprandial (30, 60, 120 min): 80–110 mg/dL
- HbA1c (hemoglobina glicosilada): < 5.3%
- HDL Colesterol: 50–70 mg/dL
- Hierro Sérico: 80–99 mg/dL
- Homocisteína Plasmática: 4–7 µmol/L
- Insulina en Ayuno: 2–5 µUI/mL
- Insulina postprandial (30, 60, 120 min): < 25 µUI/mL
- Inmunoglobulina A Sérica (IgA): 100–150 mg/dL
- Inmunoglobulina E Sérica (IgE): 20–50 mg/dL
- Inmunoglobulina G Sérica (IgG): 1000–1200 mg/dL
- Inmunoglobulina M Sérica (IgM): 70–100 mg/dL
- Lactato Deshidrogenasa (LDH): 145–160 U/L
- LDL Colesterol: 90–115 mg/dL
- Lipoproteína A (Lp(a)): < 30 mg/dL
- Magnesio Sérico: 2–2.6 mg/dL
- Metahemoglobina: < 1%
- Metilmalonato en orina: 0.7–2.3 µg/mg creatinina
- Metilmalonato en suero: < 270 nmol/L
- Potasio Sérico: 4.4–4.8 mEq/L
- PCR ultrasensible (PCR-us): < 1 mg/L
- Prolactina: 5–19 ng/mL
- Proteína Sérica Total: 7–7.3 g/dL
- Saturación de Transferrina: 30–33%
- Sodio Sérico: 138–142 mEq/L
- TSH: 0.45–2 µUI/mL
- T4 Libre: 1.3–1.8 ng/mL
- T4 Total: 77.2–154.4 nmol/L
- T3 Libre: 3.3–4.5 pg/mL
- T3 Reverso (rT3): 11–18 ng/dL
- T3 Total: 120–181 ng/dL
- T3L/T4L: > 0.33
- T3T/T3R: > 6
- Triglicéridos: 50–75 mg/dL
- Triglicéridos/HDL: < 2
- VSG / Eritrosedimentación (mujer): < 10 mm/h
- VSG / Eritrosedimentación (hombre): < 5 mm/h
- Vitamina B12: > 500 pg/mL
- Yoduria (tras carga de 50 mg de yodoral): > 45000 µg/24h
- Zinc Plasmático: 90–150 µg/dL
`.trim();
