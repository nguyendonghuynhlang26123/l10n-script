import 'package:new_admintool/l10n/l10n.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:new_admintool/app/constraint_layout.dart';
import 'package:new_admintool/const.dart';

class ChartsAboutPage extends StatelessWidget {
  const ChartsAboutPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ScrollConfiguration(
      behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
      child: SingleChildScrollView(
        controller: ScrollController(),
        child: Container(
          margin: kPaddingForEveryScreen,
          child: Wrap(
            spacing: 15,
            runSpacing: 15,
            children: [
              const ChartsAboutCard(
                title: 'What is the Spectators Behavior Analysis?',
                content:
                    'TIXnGO works everyday to improve security and reduce fraud in your events. The spectator behavior analysis is a Machine Learning tool developed by TIXnGO that classifies the actions of spectators during an event. Its purpose is to provide organizers with a deeper understanding of tickets life within their events and to help detecting users that might need monitoring.',
              ),
              const ChartsAboutCard(
                title: 'How does it work?',
                content:
                    "This tool uses an ensemble of Machine Learning models and classifies regularly each spectator's behavior based on his transfers activity in every event where tickets have been injected. The Charts tab allows you to see an almost real-time representation of your events. This functionality coupled with our Blockchain technology, grants you the insurance to see who's in possession of your tickets at all times. This representation comes with a classification of spectators to help you identify users that might act in an unwanted way.",
              ),
              const ChartsAboutCard(
                title: 'Disclaimer',
                content:
                    'Please bear in mind that this tool is an ongoing project that will improve upon time and data. Furthermore, the model used in the classification runs under the assumption that some kind of undesirable beahvior will exist in the event. This implies that the resulting classification might not be relevant if every user acts with respect to the terms of use. The same applies for events with a very small amount of spectators.',
              ),
              const ChartsAboutCard(
                title: 'How to read it?',
                content:
                    'The color coded nodes represents users with tickets. The label on the left side explains the behavior for each color. Green nodes are spectator with an Adequate Behavior, yellow ones are more dubious, oranges behave in a way we would prefer to avoid and red nodes are clearly bad behavior. The size of nodes represents the inverse of trust score.',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ChartsAboutCard extends StatelessWidget {
  const ChartsAboutCard({
    Key? key,
    required this.title,
    required this.content,
  }) : super(key: key);
  final String title;
  final String content;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: MediaQuery.of(context).size.width * 0.7,
      margin: const EdgeInsets.only(bottom: 22.0),
      padding: const EdgeInsets.only(
          left: 30.0, right: 15.0, top: 30.0, bottom: 30.0),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.all(Radius.circular(5)),
        boxShadow: [
          BoxShadow(
            color: Color.fromRGBO(167, 209, 212, 0.3),
            spreadRadius: 5,
            blurRadius: 30,
            offset: Offset(-1, -1), // changes position of shadow
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.montserrat(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: ColorProvider.kDarkBlue),
            softWrap: true,
          ),
          const SizedBox(height: 10),
          Text(
            content,
            style: GoogleFonts.montserrat(
                fontSize: 14, color: ColorProvider.kReusableGreyColor),
            softWrap: true,
          ),
        ],
      ),
    );
  }
}
