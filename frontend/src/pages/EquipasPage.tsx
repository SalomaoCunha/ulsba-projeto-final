import React, { useState, useEffect } from 'react';
import { getEquipasFicticias } from '../services/equipaService';
import { getViaturasFicticias } from '../services/viaturaService';
import type { Equipa } from '../types/equipa';
import type { Viatura } from '../types/viatura';


const EquipasPage: React.FC = () => {
  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);

  useEffect(() =>{
    getEquipasFicticias().then(setEquipas);
    getViaturasFicticias().then(setViaturas);
  }, [])

  const viaturasDaEquipa = (equipa: Equipa) => {
    return viaturas.filter(e => e.equipaId === equipa.id);
  }

  const viaturasSemEquipa = () => {
    return viaturas.filter(e => e.equipaId === null);
  }

  return('a');
};

export default EquipasPage;
