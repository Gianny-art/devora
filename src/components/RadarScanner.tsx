import { motion } from 'framer-motion';

interface RadarScannerProps {
  scanning: boolean;
  onScan: () => void;
  disabled?: boolean;
  label?: string;
  scanningLabel?: string;
}

export function RadarScanner({ scanning, onScan, disabled, label = 'Scan', scanningLabel = 'Scan en cours...' }: RadarScannerProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-primary/20"
          style={{ width: ring * 140, height: ring * 140 }}
          animate={scanning ? { scale: [1, 1.05, 1], opacity: [0.3, 0.15, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: ring * 0.3 }}
        />
      ))}

      {/* Sweep line */}
      {scanning && (
        <motion.div
          className="absolute w-[210px] h-0.5 origin-left"
          style={{
            left: '50%',
            top: '50%',
            background: 'linear-gradient(90deg, hsl(var(--primary)), transparent)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Ping effect */}
      {scanning && (
        <motion.div
          className="absolute rounded-full bg-primary/10"
          style={{ width: 300, height: 300 }}
          animate={{ scale: [0.5, 2.2], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Center button */}
      <motion.button
        onClick={onScan}
        disabled={scanning || disabled}
        className="relative z-10 flex items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30 hover:border-primary/70 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ width: 160, height: 160 }}
        whileHover={!scanning ? { scale: 1.03 } : {}}
        whileTap={!scanning ? { scale: 0.97 } : {}}
      >
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_16px_hsl(var(--primary)/0.25)]"
            animate={scanning ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
            </svg>
          </motion.div>
          <span className="text-sm font-semibold text-primary">
            {scanning ? scanningLabel : label}
          </span>
        </div>
      </motion.button>
    </div>
  );
}
