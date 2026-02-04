import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiCheck, FiChevronRight, FiActivity, FiPieChart } from "react-icons/fi";
import { GiCoffeeCup, GiFruitBowl, GiMeal, GiNightSleep, GiWaterBottle } from "react-icons/gi";

export default function UserMealPlan() {
  const [selectedDay, setSelectedDay] = useState("Lunes");
  const [checkedMeals, setCheckedMeals] = useState(new Set());

  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  // Datos simulados del plan
  const weeklyPlan = {
    "Lunes": [
      { id: "m1", type: "Desayuno", time: "08:00", name: "Avena con Frutos Rojos", cals: 350, protein: 12, carbs: 45, fat: 6, icon: <GiCoffeeCup /> },
      { id: "m2", type: "Snack", time: "11:00", name: "Yogurt Griego y Nueces", cals: 180, protein: 15, carbs: 8, fat: 10, icon: <GiFruitBowl /> },
      { id: "m3", type: "Almuerzo", time: "14:00", name: "Pollo a la Plancha y Quinoa", cals: 550, protein: 45, carbs: 50, fat: 12, icon: <GiMeal /> },
      { id: "m4", type: "Cena", time: "20:00", name: "Ensalada de Atún", cals: 320, protein: 28, carbs: 10, fat: 14, icon: <GiNightSleep /> },
    ],
    "Martes": [
      { id: "t1", type: "Desayuno", time: "08:00", name: "Tostadas de Aguacate y Huevo", cals: 400, protein: 18, carbs: 30, fat: 18, icon: <GiCoffeeCup /> },
      { id: "t2", type: "Snack", time: "11:00", name: "Batido de Proteína", cals: 150, protein: 25, carbs: 5, fat: 2, icon: <GiWaterBottle /> },
      { id: "t3", type: "Almuerzo", time: "14:00", name: "Pasta Integral con Pavo", cals: 600, protein: 35, carbs: 70, fat: 10, icon: <GiMeal /> },
      { id: "t4", type: "Cena", time: "20:00", name: "Merluza al Vapor", cals: 300, protein: 30, carbs: 5, fat: 8, icon: <GiNightSleep /> },
    ],
    // Puedes rellenar el resto de días...
    "Miércoles": [], "Jueves": [], "Viernes": [], "Sábado": [], "Domingo": []
  };

  const currentMeals = weeklyPlan[selectedDay] || [];

  // Cálculos dinámicos
  const dailyTotals = useMemo(() => {
    return currentMeals.reduce((acc, meal) => ({
      cals: acc.cals + meal.cals,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }), { cals: 0, protein: 0, carbs: 0, fat: 0 });
  }, [currentMeals]);

  const completedCount = currentMeals.filter(m => checkedMeals.has(m.id)).length;
  const progress = currentMeals.length > 0 ? (completedCount / currentMeals.length) * 100 : 0;

  const toggleMeal = (id) => {
    setCheckedMeals(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="dashboard-content">
      {/* Header Section */}
      <motion.div 
        className="welcome-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="welcome-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="welcome-text">
            <h2>Plan Alimenticio</h2>
            <p>Organiza tus comidas y cumple tus macros diarios</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color, #10b981)' }}>
              {dailyTotals.cals} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>kcal</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Objetivo Diario</div>
          </div>
        </div>
      </motion.div>

      {/* Day Selector Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        padding: '20px 0', 
        marginBottom: '10px',
        scrollbarWidth: 'none' 
      }}>
        {days.map((day) => (
          <motion.button
            key={day}
            onClick={() => setSelectedDay(day)}
            style={{
              background: selectedDay === day ? 'var(--primary-color, #10b981)' : 'var(--card-bg, #1f2937)',
              color: selectedDay === day ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-dark, #374151)',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              position: 'relative'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {day}
            {selectedDay === day && (
              <motion.div
                layoutId="activeTab"
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '50%',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'currentColor',
                  translateX: '-50%'
                }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Progress Bar */}
      <motion.div 
        className="stat-card" 
        style={{ padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div style={{ 
          width: '50px', height: '50px', 
          borderRadius: '50%', background: 'var(--input-bg-dark)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary-color, #10b981)'
        }}>
          <FiActivity size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Progreso del Día</span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--input-bg-dark)', borderRadius: '4px', overflow: 'hidden' }}>
            <motion.div 
              style={{ height: '100%', background: 'var(--primary-color, #10b981)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Meals List */}
      <div className="kpi-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {currentMeals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <FiCalendar size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p>No hay comidas planificadas para este día</p>
              </div>
            ) : (
              currentMeals.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  className={`stat-card ${checkedMeals.has(meal.id) ? 'highlight-border' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '20px',
                    opacity: checkedMeals.has(meal.id) ? 0.6 : 1
                  }}
                >
                  {/* Icon & Time */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', 
                      borderRadius: '12px', 
                      background: checkedMeals.has(meal.id) ? '#10b98120' : 'var(--input-bg-dark)',
                      color: checkedMeals.has(meal.id) ? '#10b981' : 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '8px',
                      fontSize: '20px'
                    }}>
                      {meal.icon}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {meal.time}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="status-badge" style={{ 
                        background: 'var(--input-bg-dark)', 
                        color: 'var(--text-secondary)',
                        fontSize: '10px', padding: '2px 8px'
                      }}>
                        {meal.type}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
                      {meal.name}
                    </h3>
                    
                    {/* Macros Mini Grid */}
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiPieChart size={10} color="#f59e0b" /> {meal.cals} kcal
                      </span>
                      <span>Prot: <b>{meal.protein}g</b></span>
                      <span>Carb: <b>{meal.carbs}g</b></span>
                    </div>
                  </div>

                  {/* Action */}
                  <motion.button
                    onClick={() => toggleMeal(meal.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '50%',
                      border: checkedMeals.has(meal.id) ? 'none' : '2px solid var(--border-dark)',
                      background: checkedMeals.has(meal.id) ? '#10b981' : 'transparent',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {checkedMeals.has(meal.id) ? <FiCheck size={20} /> : <FiChevronRight size={20} color="var(--text-secondary)" />}
                  </motion.button>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Weekly Summary Row */}
      <div className="metrics-grid" style={{ marginTop: '30px' }}>
        <div className="metric">
           <div className="metric-label">Proteína Total</div>
           <div className="metric-value">{dailyTotals.protein}g</div>
           <div className="metric-trend positive" style={{ fontSize: '12px' }}>Objetivo: 160g</div>
        </div>
        <div className="metric">
           <div className="metric-label">Carbohidratos</div>
           <div className="metric-value">{dailyTotals.carbs}g</div>
           <div className="metric-trend neutral" style={{ fontSize: '12px' }}>Objetivo: 200g</div>
        </div>
        <div className="metric">
           <div className="metric-label">Grasas</div>
           <div className="metric-value">{dailyTotals.fat}g</div>
           <div className="metric-trend negative" style={{ fontSize: '12px' }}>Objetivo: 60g</div>
        </div>
      </div>
    </div>
  );
}