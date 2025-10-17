// ============================================================================
// COMPONENT TESTING SUITE - STRATEGIC ANALYSIS MODAL
// ============================================================================
// Tests for the StrategicAnalysisModal component including theme review,
// strategic insights display, and user interactions
// ============================================================================

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import StrategicAnalysisModal from '@/components/StrategicAnalysisModal'

// Mock theme data
const mockTheme = {
  id: 'test-theme-id',
  name: 'Test Theme',
  description: 'Test theme description',
  customerCount: 10,
  mentionCount: 15,
  sentiment: 0.8,
  priority: 85,
  finalPriority: 76,
  strategicAlignment: 90,
  strategicReasoning: 'This theme strongly aligns with our innovation strategy and customer needs.',
  strategicConflicts: ['Minor conflict with resource allocation'],
  strategicOpportunities: ['Could drive customer acquisition', 'Supports our differentiation'],
  recommendation: 'high_priority',
  pmNotes: null,
  declinedReason: null,
  tags: ['innovation', 'customer-experience']
}

const mockOnClose = jest.fn()
const mockOnThemeReview = jest.fn()

describe('StrategicAnalysisModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Modal Display', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Strategic Analysis')).toBeInTheDocument()
      expect(screen.getByText('Test Theme')).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(
        <StrategicAnalysisModal
          isOpen={false}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.queryByText('Strategic Analysis')).not.toBeInTheDocument()
    })

    it('should display theme details correctly', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Test Theme')).toBeInTheDocument()
      expect(screen.getByText('Test theme description')).toBeInTheDocument()
      expect(screen.getByText('10 customers')).toBeInTheDocument()
      expect(screen.getByText('15 mentions')).toBeInTheDocument()
      expect(screen.getByText('90/100')).toBeInTheDocument() // Strategic alignment
      expect(screen.getByText('76/100')).toBeInTheDocument() // Final priority
    })

    it('should display strategic reasoning when available', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Strategic Reasoning')).toBeInTheDocument()
      expect(screen.getByText('This theme strongly aligns with our innovation strategy and customer needs.')).toBeInTheDocument()
    })

    it('should display strategic conflicts when available', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Strategic Conflicts')).toBeInTheDocument()
      expect(screen.getByText('Minor conflict with resource allocation')).toBeInTheDocument()
    })

    it('should display strategic opportunities when available', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Strategic Opportunities')).toBeInTheDocument()
      expect(screen.getByText('Could drive customer acquisition')).toBeInTheDocument()
      expect(screen.getByText('Supports our differentiation')).toBeInTheDocument()
    })

    it('should display tags correctly', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('innovation')).toBeInTheDocument()
      expect(screen.getByText('customer-experience')).toBeInTheDocument()
    })
  })

  describe('Recommendation Display', () => {
    it('should display high priority recommendation correctly', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('High Priority')).toBeInTheDocument()
    })

    it('should display medium priority recommendation correctly', () => {
      const mediumPriorityTheme = {
        ...mockTheme,
        recommendation: 'medium_priority'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mediumPriorityTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Medium Priority')).toBeInTheDocument()
    })

    it('should display low priority recommendation correctly', () => {
      const lowPriorityTheme = {
        ...mockTheme,
        recommendation: 'low_priority'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={lowPriorityTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Low Priority')).toBeInTheDocument()
    })

    it('should display explore lightweight recommendation correctly', () => {
      const exploreTheme = {
        ...mockTheme,
        recommendation: 'explore_lightweight'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={exploreTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Explore Lightweight')).toBeInTheDocument()
    })

    it('should display needs review recommendation correctly', () => {
      const needsReviewTheme = {
        ...mockTheme,
        recommendation: 'needs_review'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={needsReviewTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Needs Review')).toBeInTheDocument()
    })
  })

  describe('Theme Review Functionality', () => {
    it('should show review form when theme needs review', () => {
      const needsReviewTheme = {
        ...mockTheme,
        recommendation: 'needs_review'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={needsReviewTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Theme Review Decision')).toBeInTheDocument()
      expect(screen.getByText('Decision')).toBeInTheDocument()
      expect(screen.getByText('Notes (Optional)')).toBeInTheDocument()
    })

    it('should not show review form for approved themes', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.queryByText('Theme Review Decision')).not.toBeInTheDocument()
    })

    it('should handle review decision selection', async () => {
      const needsReviewTheme = {
        ...mockTheme,
        recommendation: 'needs_review'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={needsReviewTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      const decisionSelect = screen.getByRole('combobox')
      fireEvent.click(decisionSelect)

      // Wait for dropdown options to appear
      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument()
        expect(screen.getByText('Explore Lightweight')).toBeInTheDocument()
        expect(screen.getByText('Needs More Research')).toBeInTheDocument()
        expect(screen.getByText('Decline')).toBeInTheDocument()
      })
    })

    it('should show decline reason field when decline is selected', async () => {
      const needsReviewTheme = {
        ...mockTheme,
        recommendation: 'needs_review'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={needsReviewTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      const decisionSelect = screen.getByRole('combobox')
      fireEvent.click(decisionSelect)

      await waitFor(() => {
        const declineOption = screen.getByText('Decline')
        fireEvent.click(declineOption)
      })

      await waitFor(() => {
        expect(screen.getByText('Decline Reason')).toBeInTheDocument()
      })
    })

    it('should submit review when form is filled and submitted', async () => {
      const needsReviewTheme = {
        ...mockTheme,
        recommendation: 'needs_review'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={needsReviewTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      // Select approve decision
      const decisionSelect = screen.getByRole('combobox')
      fireEvent.click(decisionSelect)

      await waitFor(() => {
        const approveOption = screen.getByText('Approve')
        fireEvent.click(approveOption)
      })

      // Add notes
      const notesField = screen.getByLabelText('Notes (Optional)')
      fireEvent.change(notesField, { target: { value: 'This theme aligns well with our strategy' } })

      // Submit review
      const submitButton = screen.getByText('Submit Review')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnThemeReview).toHaveBeenCalledWith('test-theme-id', {
          decision: 'approve',
          notes: 'This theme aligns well with our strategy'
        })
      })
    })

    it('should validate required fields before submission', async () => {
      const needsReviewTheme = {
        ...mockTheme,
        recommendation: 'needs_review'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={needsReviewTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      const submitButton = screen.getByText('Submit Review')
      fireEvent.click(submitButton)

      // Should not submit without decision
      expect(mockOnThemeReview).not.toHaveBeenCalled()
    })

    it('should require decline reason when decline is selected', async () => {
      const needsReviewTheme = {
        ...mockTheme,
        recommendation: 'needs_review'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={needsReviewTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      // Select decline decision
      const decisionSelect = screen.getByRole('combobox')
      fireEvent.click(decisionSelect)

      await waitFor(() => {
        const declineOption = screen.getByText('Decline')
        fireEvent.click(declineOption)
      })

      // Try to submit without decline reason
      const submitButton = screen.getByText('Submit Review')
      fireEvent.click(submitButton)

      // Should not submit without decline reason
      expect(mockOnThemeReview).not.toHaveBeenCalled()
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      const backdrop = screen.getByRole('dialog')
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not close when modal content is clicked', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      const modalContent = screen.getByText('Test Theme')
      fireEvent.click(modalContent)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle theme with missing strategic data', () => {
      const incompleteTheme = {
        id: 'test-theme-id',
        name: 'Incomplete Theme',
        description: 'Theme with missing data',
        customerCount: 5,
        mentionCount: 8,
        sentiment: 0.7,
        priority: 70,
        finalPriority: 65,
        strategicAlignment: null,
        strategicReasoning: null,
        strategicConflicts: null,
        strategicOpportunities: null,
        recommendation: 'needs_review',
        pmNotes: null,
        declinedReason: null,
        tags: []
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={incompleteTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Incomplete Theme')).toBeInTheDocument()
      expect(screen.getByText('Theme with missing data')).toBeInTheDocument()
    })

    it('should handle theme with empty arrays', () => {
      const emptyArraysTheme = {
        ...mockTheme,
        strategicConflicts: [],
        strategicOpportunities: [],
        tags: []
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={emptyArraysTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Test Theme')).toBeInTheDocument()
      expect(screen.queryByText('Strategic Conflicts')).not.toBeInTheDocument()
      expect(screen.queryByText('Strategic Opportunities')).not.toBeInTheDocument()
    })

    it('should handle very long theme descriptions', () => {
      const longDescriptionTheme = {
        ...mockTheme,
        description: 'This is a very long theme description that contains a lot of text and should be properly displayed within the modal without causing layout issues or overflow problems. The description should wrap appropriately and maintain good readability.'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={longDescriptionTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText(/This is a very long theme description/)).toBeInTheDocument()
    })

    it('should handle theme with special characters in name and description', () => {
      const specialCharTheme = {
        ...mockTheme,
        name: 'Theme with Special Characters: "quotes", <tags>, & symbols',
        description: 'Description with émojis 🚀 and spëcial châracters'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={specialCharTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByText('Theme with Special Characters: "quotes", <tags>, & symbols')).toBeInTheDocument()
      expect(screen.getByText('Description with émojis 🚀 and spëcial châracters')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should be keyboard accessible', () => {
      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={mockTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      // Tab navigation should work
      const closeButton = screen.getByRole('button', { name: /close/i })
      closeButton.focus()
      expect(closeButton).toHaveFocus()
    })

    it('should have proper labels for form elements', () => {
      const needsReviewTheme = {
        ...mockTheme,
        recommendation: 'needs_review'
      }

      render(
        <StrategicAnalysisModal
          isOpen={true}
          onClose={mockOnClose}
          theme={needsReviewTheme}
          onThemeReview={mockOnThemeReview}
        />
      )

      expect(screen.getByLabelText('Decision')).toBeInTheDocument()
      expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument()
    })
  })
})
