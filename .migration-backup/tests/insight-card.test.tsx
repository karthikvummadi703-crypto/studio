import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InsightCategoryCard from '@/components/insights/insight-card';
import { Car } from 'lucide-react';

const mockItems = [
  {
    action: 'Switch to cycling',
    impactLevel: 'High',
    difficultyLevel: 'Easy',
    estimatedCarbonSavings: '120kg CO2/year',
  },
  {
    action: 'Use public transport',
    impactLevel: 'Medium',
    difficultyLevel: 'Medium',
    estimatedCarbonSavings: '80kg CO2/year',
  },
];

describe('InsightCategoryCard', () => {
  it('renders the category title', () => {
    render(<InsightCategoryCard title="Transportation" icon={Car} items={mockItems} />);
    expect(screen.getByText('Transportation')).toBeInTheDocument();
  });

  it('renders all recommendation items', () => {
    render(<InsightCategoryCard title="Transportation" icon={Car} items={mockItems} />);
    expect(screen.getByText('Switch to cycling')).toBeInTheDocument();
    expect(screen.getByText('Use public transport')).toBeInTheDocument();
  });

  it('renders carbon savings for each item', () => {
    render(<InsightCategoryCard title="Transportation" icon={Car} items={mockItems} />);
    expect(screen.getByText('120kg CO2/year')).toBeInTheDocument();
    expect(screen.getByText('80kg CO2/year')).toBeInTheDocument();
  });

  it('renders impact level badges', () => {
    render(<InsightCategoryCard title="Transportation" icon={Car} items={mockItems} />);
    expect(screen.getByText(/High Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Medium Impact/i)).toBeInTheDocument();
  });

  it('renders nothing when items array is empty', () => {
    const { container } = render(
      <InsightCategoryCard title="Transportation" icon={Car} items={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('has correct aria-label on the card', () => {
    render(<InsightCategoryCard title="Transportation" icon={Car} items={mockItems} />);
    expect(
      screen.getByRole('region', { name: /transportation recommendations/i })
    ).toBeInTheDocument();
  });

  it('renders difficulty level for each item', () => {
    render(<InsightCategoryCard title="Transportation" icon={Car} items={mockItems} />);
    expect(screen.getByText(/Difficulty: Easy/i)).toBeInTheDocument();
    expect(screen.getByText(/Difficulty: Medium/i)).toBeInTheDocument();
  });
});
