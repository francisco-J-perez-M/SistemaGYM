import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiUsers, FiTrendingUp, FiCheckCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { GiFruitBowl, GiMeat, GiChickenOven, GiFishCooked } from "react-icons/gi";

export default function UserRecipes() {
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [completedRecipes, setCompletedRecipes] = useState(new Set());

  const recipes = [
    {
      id: 1,
      title: "Ensalada Proteica Post-Entrenamiento",
      category: "Alto en Proteína",
      icon: <GiFruitBowl />,
      color: "#10b981",
      time: "15 min",
      servings: 2,
      difficulty: "Fácil",
      calories: 450,
      protein: 35,
      carbs: 25,
      fats: 20,
      ingredients: [
        "200g de pechuga de pollo a la plancha",
        "100g de quinoa cocida",
        "1 taza de espinacas frescas",
        "1/2 aguacate",
        "Tomates cherry",
        "Aceite de oliva",
        "Limón y sal al gusto"
      ],
      steps: [
        "Cocina la quinoa según las instrucciones del paquete",
        "Corta la pechuga de pollo en tiras",
        "Mezcla las espinacas, quinoa y tomates",
        "Agrega el pollo y el aguacate",
        "Aliña con aceite de oliva y limón"
      ]
    },
    {
      id: 2,
      title: "Batido Verde Energético",
      category: "Pre-Entrenamiento",
      icon: <GiFruitBowl />,
      color: "#22c55e",
      time: "5 min",
      servings: 1,
      difficulty: "Muy Fácil",
      calories: 280,
      protein: 15,
      carbs: 40,
      fats: 8,
      ingredients: [
        "1 plátano",
        "1 taza de espinacas",
        "1 scoop de proteína de vainilla",
        "1 cucharada de mantequilla de almendras",
        "1 taza de leche de almendras",
        "Hielo al gusto"
      ],
      steps: [
        "Coloca todos los ingredientes en la licuadora",
        "Licúa hasta obtener una mezcla homogénea",
        "Sirve inmediatamente",
        "Consume 30-45 minutos antes de entrenar"
      ]
    },
    {
      id: 3,
      title: "Salmón al Horno con Verduras",
      category: "Omega-3",
      icon: <GiFishCooked />,
      color: "#f97316",
      time: "30 min",
      servings: 2,
      difficulty: "Media",
      calories: 520,
      protein: 42,
      carbs: 20,
      fats: 28,
      ingredients: [
        "2 filetes de salmón",
        "Brócoli",
        "Zanahoria",
        "Pimientos",
        "Aceite de oliva",
        "Limón",
        "Ajo y especias"
      ],
      steps: [
        "Precalienta el horno a 200°C",
        "Coloca el salmón y las verduras en una bandeja",
        "Rocía con aceite de oliva y especias",
        "Hornea durante 20-25 minutos",
        "Sirve con limón fresco"
      ]
    },
    {
      id: 4,
      title: "Bowl de Pollo Teriyaki",
      category: "Alto en Proteína",
      icon: <GiChickenOven />,
      color: "#eab308",
      time: "25 min",
      servings: 2,
      difficulty: "Media",
      calories: 480,
      protein: 38,
      carbs: 45,
      fats: 12,
      ingredients: [
        "250g de pechuga de pollo",
        "1 taza de arroz integral",
        "Salsa teriyaki",
        "Brócoli al vapor",
        "Zanahoria rallada",
        "Sésamo",
        "Cebollín"
      ],
      steps: [
        "Cocina el arroz integral",
        "Corta el pollo en cubos y marínalo en teriyaki",
        "Saltea el pollo hasta que esté dorado",
        "Cocina las verduras al vapor",
        "Sirve todo en un bowl y decora con sésamo"
      ]
    },
    {
      id: 5,
      title: "Tacos Proteicos de Carne Magra",
      category: "Post-Entrenamiento",
      icon: <GiMeat />,
      color: "#dc2626",
      time: "20 min",
      servings: 3,
      difficulty: "Fácil",
      calories: 420,
      protein: 32,
      carbs: 35,
      fats: 15,
      ingredients: [
        "300g de carne molida magra",
        "Tortillas integrales",
        "Lechuga",
        "Tomate",
        "Cebolla",
        "Aguacate",
        "Salsa picante",
        "Especias mexicanas"
      ],
      steps: [
        "Cocina la carne con las especias",
        "Calienta las tortillas",
        "Pica las verduras frescas",
        "Ensambla los tacos con todos los ingredientes",
        "Sirve con limón y salsa al gusto"
      ]
    },
    {
      id: 6,
      title: "Wrap de Atún Mediterráneo",
      category: "Bajo en Carbos",
      icon: <GiFishCooked />,
      color: "#3b82f6",
      time: "10 min",
      servings: 1,
      difficulty: "Muy Fácil",
      calories: 350,
      protein: 28,
      carbs: 30,
      fats: 12,
      ingredients: [
        "1 lata de atún en agua",
        "Tortilla integral",
        "Pepino",
        "Tomate",
        "Aceitunas",
        "Queso feta light",
        "Yogurt griego",
        "Limón"
      ],
      steps: [
        "Escurre el atún y mézclalo con yogurt griego",
        "Pica las verduras en cubos pequeños",
        "Extiende la tortilla y coloca el atún",
        "Agrega las verduras y el queso",
        "Enrolla firmemente y corta por la mitad"
      ]
    }
  ];

  const toggleRecipe = (recipeId) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  const toggleCompleted = (recipeId) => {
    setCompletedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  return (
    <div className="dashboard-content">
      <motion.div
        className="welcome-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Recetas Saludables</h2>
            <p>Descubre deliciosas opciones nutritivas para alcanzar tus objetivos fitness</p>
          </div>
        </div>
      </motion.div>

      <div className="kpi-grid" style={{ marginTop: "30px" }}>
        {recipes.map((recipe, index) => (
          <motion.div
            key={recipe.id}
            className={`stat-card ${completedRecipes.has(recipe.id) ? 'highlight-border' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -5 }}
          >
            <div className="stat-header">
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <motion.div
                  className="card-icon-wrapper"
                  style={{ 
                    background: `${recipe.color}20`,
                    color: recipe.color,
                    marginBottom: 0
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {recipe.icon}
                </motion.div>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: "16px", 
                    color: "var(--text-primary)",
                    textTransform: "none",
                    letterSpacing: "normal",
                    fontWeight: "700"
                  }}>
                    {recipe.title}
                  </h3>
                  <span className="status-badge normal" style={{ 
                    background: `${recipe.color}20`,
                    color: recipe.color,
                    marginTop: "6px",
                    display: "inline-block"
                  }}>
                    {recipe.category}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "16px",
              marginBottom: "16px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border-dark)"
            }}>
              <div className="detail-row" style={{ flex: 1, justifyContent: "flex-start" }}>
                <FiClock size={16} style={{ color: recipe.color }} />
                <span style={{ fontSize: "13px" }}>{recipe.time}</span>
              </div>
              <div className="detail-row" style={{ flex: 1, justifyContent: "flex-start" }}>
                <FiUsers size={16} style={{ color: recipe.color }} />
                <span style={{ fontSize: "13px" }}>{recipe.servings} pers.</span>
              </div>
              <div className="detail-row" style={{ flex: 1, justifyContent: "flex-start" }}>
                <FiTrendingUp size={16} style={{ color: recipe.color }} />
                <span style={{ fontSize: "13px" }}>{recipe.difficulty}</span>
              </div>
            </div>

            <div className="metrics-grid" style={{ marginTop: "16px", paddingTop: "0", border: "none" }}>
              <div className="metric">
                <div className="metric-icon">{recipe.calories}</div>
                <div>
                  <div className="metric-label">Calorías</div>
                  <div className="metric-value" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    kcal
                  </div>
                </div>
              </div>
              <div className="metric">
                <div className="metric-icon" style={{ background: `${recipe.color}20`, color: recipe.color }}>
                  {recipe.protein}g
                </div>
                <div>
                  <div className="metric-label">Proteína</div>
                  <div className="metric-value" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    gramos
                  </div>
                </div>
              </div>
              <div className="metric">
                <div className="metric-icon">{recipe.carbs}g</div>
                <div>
                  <div className="metric-label">Carbos</div>
                  <div className="metric-value" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    gramos
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedRecipe === recipe.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ 
                    marginTop: "20px", 
                    paddingTop: "20px", 
                    borderTop: "1px solid var(--border-dark)" 
                  }}>
                    <h4 style={{ 
                      fontSize: "14px", 
                      fontWeight: "600", 
                      marginBottom: "12px",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <GiFruitBowl style={{ color: recipe.color }} />
                      Ingredientes
                    </h4>
                    <ul style={{ 
                      paddingLeft: "20px", 
                      margin: "0 0 16px 0",
                      listStyle: "none"
                    }}>
                      {recipe.ingredients.map((ingredient, i) => (
                        <motion.li
                          key={i}
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "13px",
                            marginBottom: "6px",
                            paddingLeft: "12px",
                            position: "relative"
                          }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <span style={{
                            position: "absolute",
                            left: 0,
                            color: recipe.color
                          }}>•</span>
                          {ingredient}
                        </motion.li>
                      ))}
                    </ul>

                    <h4 style={{ 
                      fontSize: "14px", 
                      fontWeight: "600", 
                      marginBottom: "12px",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <FiCheckCircle style={{ color: recipe.color }} />
                      Preparación
                    </h4>
                    <ol style={{ 
                      paddingLeft: "20px", 
                      margin: "0",
                      counterReset: "step-counter"
                    }}>
                      {recipe.steps.map((step, i) => (
                        <motion.li
                          key={i}
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "13px",
                            marginBottom: "8px",
                            lineHeight: "1.5",
                            listStyle: "none",
                            counterIncrement: "step-counter",
                            paddingLeft: "28px",
                            position: "relative"
                          }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <span style={{
                            position: "absolute",
                            left: 0,
                            width: "20px",
                            height: "20px",
                            background: `${recipe.color}20`,
                            color: recipe.color,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}>
                            {i + 1}
                          </span>
                          {step}
                        </motion.li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ 
              display: "flex", 
              gap: "10px",
              marginTop: "16px"
            }}>
              <motion.button
                className="btn-compact-primary"
                style={{
                  flex: 1,
                  background: recipe.color,
                  color: "white",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleCompleted(recipe.id)}
              >
                <FiCheckCircle size={16} />
                {completedRecipes.has(recipe.id) ? "Preparada" : "Marcar"}
              </motion.button>

              <motion.button
                className="icon-btn"
                style={{
                  background: "var(--input-bg-dark)",
                  border: `1px solid var(--border-dark)`,
                  color: "var(--text-secondary)",
                  width: "44px",
                  height: "44px"
                }}
                whileHover={{ 
                  background: recipe.color,
                  color: "white",
                  borderColor: recipe.color
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleRecipe(recipe.id)}
              >
                <motion.div
                  animate={{ rotate: expandedRecipe === recipe.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {expandedRecipe === recipe.id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}