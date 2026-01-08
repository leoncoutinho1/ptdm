import { motion } from 'framer-motion';
import { Paper, PaperProps } from '@mantine/core';
import { ReactNode } from 'react';

interface AnimatedCardProps extends PaperProps {
    children: ReactNode;
    delay?: number;
}

export function AnimatedCard({ children, delay = 0, ...props }: AnimatedCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <Paper {...props}>
                {children}
            </Paper>
        </motion.div>
    );
}
