

class GapActionsView(APIView):
    """Handle user submissions for gap actions (submit data, request update, correct info)"""
    
    def post(self, request):
        """Accept gap action submissions"""
        try:
            data = request.data
            action_type = data.get('action_type')  # 'submit', 'correct', 'request'
            gap_title = data.get('gap_title', '')
            gap_description = data.get('gap_description', '')
           affected_study_id = data.get('affected_study_id')
            affected_study_title = data.get('affected_study_title')
            message = data.get('message', '')
            email = data.get('email', '')
            name = data.get('name', '')
            timestamp = data.get('timestamp', datetime.now().isoformat())
            
            # Validate required fields
            if not all([action_type, gap_title, message, email, name]):
                return Response(
                    {'error': 'Missing required fields: action_type, gap_title, message, email, name'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Log the submission to a file for now (can be replaced with database storage)
            log_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'gap_actions.log')
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            
            log_entry = {
                'timestamp': timestamp,
                'action_type': action_type,
                'gap_title': gap_title,
                'gap_description': gap_description,
                'affected_study_id': affected_study_id,
                'affected_study_title': affected_study_title,
                'message': message,
                'email': email,
                'name': name,
            }
            
            import json
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry) + '\n')
            
            return Response({
                'status': 'success',
                'message': f'{action_type.title()} request received and logged',
                'submission_time': timestamp,
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to process submission: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
