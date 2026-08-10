import { ROLE_LEVEL } from '../constants/ROLE_CONSTANTS';

export const hasMinRole = (currentRole, requiredMinRole) => {
  const currentLevel = ROLE_LEVEL[currentRole] || 0;
  const requiredLevel = ROLE_LEVEL[requiredMinRole] || 999;
  return currentLevel >= requiredLevel;
};
