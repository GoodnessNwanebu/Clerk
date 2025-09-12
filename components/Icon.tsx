import React from 'react';
import {
  Stethoscope, MessageSquare, Users, Award, Play, Book, History, Settings,
  ArrowRight, ArrowLeft, ArrowDown, Mic, MicOff, Check, AlertTriangle,
  Lightbulb, Baby, User, Heart, X, ChevronsRight, SendHorizontal, Loader2,
  Mail, Sun, Moon, Monitor, Target, Search, AlertCircle, Clock, RotateCcw,
  Scissors, Venus, MapPin, Activity, Zap, Brain, Droplets, Wind, Scan,
  Shield, Bug, Ear, Eye, ZapOff, Bone, Sparkles, Droplet, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Bookmark,
  Chrome, Compass, Info, Image, Download, UserCheck, FileText, Microscope, ClipboardList, MessageCircle, Share2, Trash2, Calendar, Plus, Filter, Eye as EyeIcon, Drill, Copy
} from 'lucide-react';

// Using lucide-react directly is simpler and more maintainable
// than managing SVG paths manually.

export const Icon: React.FC<{ name: string; className?: string; size?: number }> = ({ name, className, size = 24 }) => {
  const iconProps = { className, size };
  switch (name) {
    case 'stethoscope': return <Stethoscope {...iconProps} />;
    case 'message-square': return <MessageSquare {...iconProps} />;
    case 'users': return <Users {...iconProps} />;
    case 'award': return <Award {...iconProps} />;
    case 'play': return <Play {...iconProps} />;
    case 'book': return <Book {...iconProps} />;
    case 'history': return <History {...iconProps} />;
    case 'settings': return <Settings {...iconProps} />;
    case 'arrow-right': return <ArrowRight {...iconProps} />;
    case 'arrow-left': return <ArrowLeft {...iconProps} />;
    case 'arrow-down': return <ArrowDown {...iconProps} />;
    case 'mic': return <Mic {...iconProps} />;
    case 'mic-off': return <MicOff {...iconProps} />;
    case 'check': return <Check {...iconProps} />;
    case 'alert-triangle': return <AlertTriangle {...iconProps} />;
    case 'lightbulb': return <Lightbulb {...iconProps} />;
    case 'baby': return <Baby {...iconProps} />;
    case 'user': return <User {...iconProps} />;
    case 'heart': return <Heart {...iconProps} />;
    case 'x': return <X {...iconProps} />;
    case 'chevrons-right': return <ChevronsRight {...iconProps} />;
    case 'chevron-up': return <ChevronUp {...iconProps} />;
    case 'chevron-down': return <ChevronDown {...iconProps} />;
    case 'chevron-left': return <ChevronLeft {...iconProps} />;
    case 'chevron-right': return <ChevronRight {...iconProps} />;
    case 'send': return <SendHorizontal {...iconProps} />;
    case 'loader-2': return <Loader2 {...iconProps} />;
    case 'mail': return <Mail {...iconProps} />;
    // Theme icons
    case 'sun': return <Sun {...iconProps} />;
    case 'moon': return <Moon {...iconProps} />;
    case 'monitor': return <Monitor {...iconProps} />;
    // Additional icons
    case 'target': return <Target {...iconProps} />;
    case 'search': return <Search {...iconProps} />;
    case 'alert-circle': return <AlertCircle {...iconProps} />;
    case 'clock': return <Clock {...iconProps} />;
    case 'rotate-ccw': return <RotateCcw {...iconProps} />;
    case 'scissors': return <Scissors {...iconProps} />;
    case 'venus': return <Venus {...iconProps} />;
    case 'map-pin': return <MapPin {...iconProps} />;
    // Department and subspecialty icons
    case 'activity': return <Activity {...iconProps} />;
    case 'zap': return <Zap {...iconProps} />;
    case 'brain': return <Brain {...iconProps} />;
    case 'droplets': return <Droplets {...iconProps} />;
    case 'wind': return <Wind {...iconProps} />;
    case 'scan': return <Scan {...iconProps} />;
    case 'shield': return <Shield {...iconProps} />;
    case 'bug': return <Bug {...iconProps} />;
    case 'ear': return <Ear {...iconProps} />;
    case 'eye': return <Eye {...iconProps} />;
    case 'zap-off': return <ZapOff {...iconProps} />;
    case 'bone': return <Bone {...iconProps} />;
    case 'sparkles': return <Sparkles {...iconProps} />;
    case 'droplet': return <Droplet {...iconProps} />;
    case 'bookmark': return <Bookmark {...iconProps} />;
    // PWA tutorial icons
    case 'chrome': return <Chrome {...iconProps} />;
    case 'compass': return <Compass {...iconProps} />;
    case 'info': return <Info {...iconProps} />;
    case 'image': return <Image {...iconProps} />;
    case 'download': return <Download {...iconProps} />;
    case 'user-check': return <UserCheck {...iconProps} />;
    // Tab icons
    case 'file-text': return <FileText {...iconProps} />;
    case 'microscope': return <Microscope {...iconProps} />;
    case 'clipboard-list': return <ClipboardList {...iconProps} />;
    case 'message-circle': return <MessageCircle {...iconProps} />;
    // Action icons
    case 'share-2': return <Share2 {...iconProps} />;
    case 'trash-2': return <Trash2 {...iconProps} />;
    case 'calendar': return <Calendar {...iconProps} />;
    case 'plus': return <Plus {...iconProps} />;
    case 'filter': return <Filter {...iconProps} />;
    case 'eye': return <EyeIcon {...iconProps} />;
    case 'tooth': return <Drill {...iconProps} />;
    case 'copy': return <Copy {...iconProps} />;
    // Fallback for missing icons (like 'stomach')
    case 'stomach': return <Activity {...iconProps} />; // Using activity as fallback
    case 'mind': return <Brain {...iconProps} />; // Using brain as fallback
    default: return null;
  }
};