import React, { useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const THEME = {
  activeGreen: '#4CAF50',
  buttonGreen: '#2E7D32',
  rewardCardGreen: 'rgba(76, 175, 80, 0.1)',
  background: '#F8F9FA',
  white: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#555555',
  disabledGray: '#E5E5E5',
  disabledText: '#BDBDBD',
  gold: '#FFC700',
  silver: '#C4C4C4',
  bronze: '#E59934',
  completedBackground: 'rgba(76, 175, 80, 0.15)',
};

const recompensasData = [
  { title: 'Desconto de 20% na EcoGrans', points: '3000 pontos', disabled: false },
  { title: 'Desconto de 10% na PlusTea', points: '1500 pontos', disabled: false },
  { title: 'Um pacote grátis na PlantYou', points: '4500 pontos', disabled: true },
];

const metasData = [
  { description: 'Conclua 70 refeições', points: '80 pontos', completed: false },
  { description: 'Convide 10 amigos', points: '100 pontos', completed: false },
  { description: 'Gere uma refeição na despensa', points: '50 pontos', completed: false },
  { description: 'Poste uma refeição', points: '', completed: true },
];

const rankingData = [
  { rank: 1, name: 'Rebeca Soares', handle: '@rebecasoares', avatar: 'https://i.imgur.com/r3y5J9d.png' },
  { rank: 2, name: 'Cauana Pereira', handle: '@cauanapereira', avatar: 'https://i.imgur.com/lV2a2aT.jpg' },
  { rank: 3, name: 'Camilo Damasco', handle: '@camiladamasco', avatar: 'https://i.imgur.com/gK9t09y.png' },
  { rank: 4, name: 'Filipa Brita', points: 1230, avatar: 'https://i.imgur.com/lV2a2aT.jpg' },
  { rank: 5, name: 'Henriqueta Ferreira', points: 960, avatar: 'https://i.imgur.com/gK9t09y.png' },
  { rank: 6, name: 'Joana Campos', points: 679, avatar: 'https://i.imgur.com/r3y5J9d.png' },
  { rank: 7, name: 'Joana Ferreira', points: 200, avatar: 'https://i.imgur.com/gK9t09y.png' },
];

const MeusPontosTab = () => (
  <>
    <View style={styles.pointsCard}>
      <View style={styles.pointsCardTitleContainer}>
        <Text style={styles.pointsCardTitle}>Seus pontos</Text>
        <TouchableOpacity onPress={() => alert('Mais informações sobre seus pontos')}>
          <MaterialIcons name="error-outline" size={18} color={THEME.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.pointsValue}>3000</Text>
    </View>

    <View style={styles.contentSection}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Trocar pontos</Text>
          <MaterialIcons name="error-outline" size={16} color={THEME.textSecondary} />
        </TouchableOpacity>
      </View>


      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
        {recompensasData.map((item, index) => (
          <View key={index} style={[styles.rewardCard, item.disabled && styles.disabledCard]}>
            <Text style={styles.rewardTitle}>{item.title}</Text>
            <Text style={styles.rewardPoints}>{item.points}</Text>
            <TouchableOpacity
              style={[styles.rewardButton, item.disabled && styles.disabledButton]}
              disabled={item.disabled}>
              <Text style={[styles.rewardButtonText, item.disabled && styles.disabledButtonText]}>
                {item.disabled ? 'Indisponível' : 'Pegar cupom'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  </>
);

const MetasTab = () => (
  <View style={styles.contentSection}>
    {metasData.map((item, index) => (
      <View key={index} style={styles.goalCard}>
        <View>
          <Text style={styles.goalDescription}>{item.description}</Text>
          {item.points ? <Text style={styles.goalPoints}>{item.points}</Text> : null}
        </View>
        {item.completed ? (
          <View style={[styles.goalPill, styles.goalPillCompleted]}>
            <Text style={styles.goalPillTextCompleted}>concluído</Text>
          </View>
        ) : null}
      </View>
    ))}
  </View>
);

const MeuGrupoTab = () => {
  const podium = rankingData.slice(0, 3);
  const list = rankingData.slice(3);
  const getMedalColor = (rank: number) => {
    const medalColors: { [key: number]: string } = { 1: THEME.gold, 2: THEME.silver, 3: THEME.bronze };
    return medalColors[rank] || 'transparent';
  };

    type UserType = {
      rank: number;
      name: string;
      handle?: string;
      points?: number;
      avatar: string;
    };
    type PodiumUserProps = {
      user: UserType;
      elevated?: boolean;
    };
    const PodiumUser = ({ user, elevated = false }: PodiumUserProps) => (

    <View style={[styles.podiumUser, elevated && styles.podiumUserElevated]}>
      <View>
        <Image source={{ uri: user.avatar }} style={[styles.podiumAvatar, elevated && styles.podiumAvatarElevated]} />
        <View style={[styles.medal, { backgroundColor: getMedalColor(user.rank) }]}>
          <Text style={styles.medalText}>{user.rank}</Text>
        </View>
      </View>
      <Text style={styles.podiumName}>{user.name}</Text>
      {user.handle && <Text style={styles.podiumHandle}>{user.handle}</Text>}
    </View>
  );

  return (
    <View style={styles.contentSection}>
      <View style={styles.inviteCard}>
        <Text style={styles.inviteText}>Convide um amigo</Text>
        <View style={styles.inviteCodeContainer}>
          <Text style={styles.inviteCode}>2372HG6</Text>
          <Feather name="copy" size={20} color={THEME.textPrimary} />
          <Feather name="link" size={20} color={THEME.textPrimary} />
        </View>
      </View>

      <Text style={styles.rankingTitle}>Ranking de pontos do seu grupo</Text>

      <View style={styles.podiumContainer}>
        <PodiumUser user={podium[1]} />
        <PodiumUser user={podium[0]} elevated />
        <PodiumUser user={podium[2]} />
      </View>

      {list.map((user) => (
        <View key={user.rank} style={styles.listItem}>
          <Text style={styles.listRank}>{String(user.rank).padStart(2, '0')}</Text>
          <Image source={{ uri: user.avatar }} style={styles.listAvatar} />
          <Text style={styles.listName}>{user.name}</Text>
          <Text style={styles.listPoints}>{user.points} pts</Text>
        </View>
      ))}
    </View>
  );
};

export default function ConquistasScreen() {
  const [activeTab, setActiveTab] = useState('Metas');
  const router = useRouter();


type TabButtonProps = { title: string };
const TabButton = ({ title }: TabButtonProps) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === title && styles.activeTabButton]}
      onPress={() => setActiveTab(title)}>
      <Text style={[styles.tabButtonText, activeTab === title && styles.activeTabButtonText]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView  style={styles.safeArea}>
      <Image source={require('../../assets/images/fundo.png')}  style={styles.imagemFundo}></Image>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Conquistas</Text>
          <TouchableOpacity onPress={() => router.push('/(TelasAbas)/perfil')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={26} color="#111111" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TabButton title="Meus pontos" />
          <TabButton title="Metas" />
          <TabButton title="Meu grupo" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === 'Meus pontos' && <MeusPontosTab />}
          {activeTab === 'Metas' && <MetasTab />}
          {activeTab === 'Meu grupo' && <MeuGrupoTab />}
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
  },
  imagemFundo:{
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'android' ? 20 : 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#F2F2F2', 
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
    paddingVertical: 10,

  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeTabButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  tabButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#111111',
    fontWeight: '700',
  },

  contentSection: { paddingVertical: 20 },

  pointsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: width * 0.9,
    alignSelf: 'center',
    marginVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  pointsCardTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pointsCardTitle: { color: '#555', fontWeight: '500' },
  pointsValue: { fontSize: 30, fontWeight: 'bold', color: '#4CAF50' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },

  rewardCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: width * 0.43,
    height: 160,
    justifyContent: 'space-between',
  },
  rewardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111111' },
  rewardPoints: { color: '#555', fontSize: 12 },
  rewardButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rewardButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  disabledCard: { backgroundColor: '#E5E5E5' },
  disabledButton: { backgroundColor: '#BDBDBD' },
  disabledButtonText: { color: '#FFFFFF' },

  // METAS
  goalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  goalDescription: { fontSize: 16, fontWeight: '600', color: THEME.textPrimary },
  goalPoints: { color: THEME.textSecondary, marginTop: 5, fontSize: 14 },
  goalPill: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 15 },
  goalPillCompleted: { backgroundColor: THEME.completedBackground },
  goalPillTextCompleted: {
    color: THEME.buttonGreen,
    fontWeight: 'bold',
    fontSize: 12,
  },

  // GRUPO
  inviteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 3,
  },
  inviteText: { fontSize: 16, fontWeight: 'bold', color: THEME.textPrimary },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 8,
    borderRadius: 10,
    gap: 10,
  },
  inviteCode: { fontWeight: 'bold', marginRight: 5, color: THEME.textPrimary },

  rankingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textPrimary,
    marginBottom: 20,
    paddingHorizontal: 15,
    textAlign: 'center',
  },

  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 30,
    height: 150,
    paddingHorizontal: 15,
  },
  podiumUser: { alignItems: 'center', width: '33%' },
  podiumUserElevated: { transform: [{ translateY: -25 }] },
  podiumAvatar: {
    width: 75,
    height: 75,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: '#E0E0E0',
  },
  podiumAvatarElevated: { width: 90, height: 90, borderRadius: 45 },
  medal: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.white,
  },
  medalText: { color: THEME.white, fontWeight: 'bold', fontSize: 12 },
  podiumName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: THEME.textPrimary,
    textAlign: 'center',
  },
  podiumHandle: { fontSize: 12, color: THEME.textSecondary },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 25,
    backgroundColor: THEME.white,
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  listRank: { fontSize: 16, color: THEME.textSecondary, fontWeight: 'bold', width: 40 },
  listAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  listName: { flex: 1, fontSize: 16, fontWeight: '500', color: THEME.textPrimary },
  listPoints: { fontSize: 14, fontWeight: 'bold', color: THEME.textSecondary },
});
