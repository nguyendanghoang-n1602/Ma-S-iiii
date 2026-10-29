import type { Role, Team, RoomSettings, Player, GamePhase } from '../types/werewolf';

export const ROLE_DETAILS: Record<
  Role,
  {
    name: string;
    team: Team;
    teamName: string;
    description: string;
    ability: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
  }
> = {
  WEREWOLF: {
    name: 'Ma Sói',
    team: 'WEREWOLVES',
    teamName: 'Phe Ma Sói',
    description: 'Thức dậy mỗi đêm cùng đàn sói để chọn một người dân làng vô tội làm nạn nhân.',
    ability: 'Bỏ phiếu bí mật cùng bầy sói tiêu diệt mục tiêu trong đêm.',
    color: 'text-red-400',
    bgColor: 'bg-red-950/70',
    borderColor: 'border-red-600',
    icon: 'Moon',
  },
  SEER: {
    name: 'Tiên Tri',
    team: 'VILLAGERS',
    teamName: 'Phe Dân Làng',
    description: 'Thức dậy vào ban đêm để soi sáng tâm can một người chơi xem họ là Sói hay Dân.',
    ability: 'Kiểm tra bí mật một người chơi mỗi đêm: Biết được họ thuộc Phe Sói hay Dân Làng.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/70',
    borderColor: 'border-purple-600',
    icon: 'Eye',
  },
  BODYGUARD: {
    name: 'Bảo Vệ',
    team: 'VILLAGERS',
    teamName: 'Phe Dân Làng',
    description: 'Chiến binh dũng cảm canh gác ngôi làng trong màn đêm, che chở người được chọn.',
    ability: 'Bảo vệ một người chơi khỏi móng vuốt của Ma Sói mỗi đêm (không thể bảo vệ cùng 1 người 2 đêm liên tiếp).',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/70',
    borderColor: 'border-blue-600',
    icon: 'Shield',
  },
  WITCH: {
    name: 'Phù Thủy',
    team: 'VILLAGERS',
    teamName: 'Phe Dân Làng',
    description: 'Nắm giữ sức mạnh cổ xưa với 2 bình thuốc thần: Một bình cứu sống, một bình độc dược.',
    ability: 'Có 1 bình thuốc cứu và 1 bình thuốc độc dùng trong cả ván. Biết ai bị sói cắn và quyết định có dùng thuốc.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/70',
    borderColor: 'border-emerald-600',
    icon: 'Sparkles',
  },
  VILLAGER: {
    name: 'Dân Làng',
    team: 'VILLAGERS',
    teamName: 'Phe Dân Làng',
    description: 'Người dân chất phác. Vũ khí duy nhất của bạn là suy luận sắc bén và lá phiếu ban ngày.',
    ability: 'Thảo luận và bỏ phiếu tìm ra Ma Sói trà trộn trong ngôi làng vào mỗi buổi chiều.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/70',
    borderColor: 'border-amber-600',
    icon: 'Users',
  },
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  dayDiscussionDuration: 75,
  votingDuration: 40,
  nightActionDuration: 30,
  allowBlankVote: true,
  revealRoleOnDeath: true,
  allowSelfGuard: false,
  witchCanUseBothSameNight: false,
};

// Gợi ý cấu hình vai trò mặc định chuẩn
export function getPresetRolesForCount(count: number): Record<Role, number> {
  if (count <= 6) {
    // 5 - 6 người: 1 Sói, 1 Tiên Tri, 1 Bảo Vệ, còn lại Dân
    return {
      WEREWOLF: 1,
      SEER: 1,
      BODYGUARD: 1,
      WITCH: 0,
      VILLAGER: Math.max(0, count - 3),
    };
  } else if (count <= 9) {
    // 7 - 9 người: 2 Sói, 1 Tiên Tri, 1 Bảo Vệ, 1 Phù Thủy, còn lại Dân
    return {
      WEREWOLF: 2,
      SEER: 1,
      BODYGUARD: 1,
      WITCH: 1,
      VILLAGER: Math.max(0, count - 5),
    };
  } else if (count <= 12) {
    // 10 - 12 người: 3 Sói, 1 Tiên Tri, 1 Bảo Vệ, 1 Phù Thủy, còn lại Dân
    return {
      WEREWOLF: 3,
      SEER: 1,
      BODYGUARD: 1,
      WITCH: 1,
      VILLAGER: Math.max(0, count - 6),
    };
  } else {
    // 13 - 16 người: 4 Sói, 1 Tiên Tri, 1 Bảo Vệ, 1 Phù Thủy, còn lại Dân
    return {
      WEREWOLF: 4,
      SEER: 1,
      BODYGUARD: 1,
      WITCH: 1,
      VILLAGER: Math.max(0, count - 7),
    };
  }
}

// Xáo trộn và phân phối vai trò ngẫu nhiên
export function assignSecretRoles(players: Player[], roleDist: Record<Role, number>): Player[] {
  const roleList: Role[] = [];
  (Object.keys(roleDist) as Role[]).forEach((role) => {
    const qty = roleDist[role] || 0;
    for (let i = 0; i < qty; i++) {
      roleList.push(role);
    }
  });

  // Fisher-Yates shuffle
  for (let i = roleList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roleList[i], roleList[j]] = [roleList[j], roleList[i]];
  }

  return players.map((player, idx) => {
    const role = roleList[idx] || 'VILLAGER';
    return {
      ...player,
      role,
      isAlive: true,
      knownTeam: role === 'WEREWOLF' ? 'WEREWOLVES' : 'VILLAGERS',
      witchPotions: role === 'WITCH' ? { heal: true, poison: true } : undefined,
      lastProtectedTargetId: null,
    };
  });
}

// Kiểm tra điều kiện thắng
export function checkWinCondition(players: Player[]): { winner: Team | null; reason: string } {
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveWolves = alivePlayers.filter((p) => p.role === 'WEREWOLF');
  const aliveVillagers = alivePlayers.filter((p) => p.role !== 'WEREWOLF');

  if (aliveWolves.length === 0) {
    return {
      winner: 'VILLAGERS',
      reason: 'Toàn bộ Ma Sói đã bị tiêu diệt! Ngôi làng đã giành lại sự bình yên.',
    };
  }

  if (aliveWolves.length >= aliveVillagers.length) {
    return {
      winner: 'WEREWOLVES',
      reason: 'Số lượng Ma Sói đã áp đảo Dân Làng! Màn đêm bóng tối vĩnh hằng bao trùm ngôi làng.',
    };
  }

  return { winner: null, reason: '' };
}

// Xác định giai đoạn đêm tiếp theo dựa trên những người còn sống
export function getNextNightPhase(currentPhase: GamePhase, players: Player[]): GamePhase {
  const aliveRoles = new Set(players.filter((p) => p.isAlive).map((p) => p.role));

  const order: GamePhase[] = ['NIGHT_START', 'NIGHT_WOLVES', 'NIGHT_SEER', 'NIGHT_GUARD', 'NIGHT_WITCH', 'NIGHT_RESOLUTION'];

  const currentIndex = order.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === order.length - 1) {
    return 'DAY_ANNOUNCEMENT';
  }

  for (let i = currentIndex + 1; i < order.length; i++) {
    const nextPhase = order[i];
    if (nextPhase === 'NIGHT_WOLVES' && aliveRoles.has('WEREWOLF')) return 'NIGHT_WOLVES';
    if (nextPhase === 'NIGHT_SEER' && aliveRoles.has('SEER')) return 'NIGHT_SEER';
    if (nextPhase === 'NIGHT_GUARD' && aliveRoles.has('BODYGUARD')) return 'NIGHT_GUARD';
    if (nextPhase === 'NIGHT_WITCH' && aliveRoles.has('WITCH')) return 'NIGHT_WITCH';
    if (nextPhase === 'NIGHT_RESOLUTION') return 'NIGHT_RESOLUTION';
  }

  return 'NIGHT_RESOLUTION';
}
